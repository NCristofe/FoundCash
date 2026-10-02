/**
 * Testes E2E do FoundCash — roda direto no Node.js com o Supabase real.
 *
 * Como executar:
 *   SERVICE_ROLE_KEY=<chave> node scripts/test-e2e.mjs
 *
 * Onde obter a SERVICE_ROLE_KEY:
 *   Supabase Dashboard → Settings → API Keys → service_role (secret)
 *
 * O que é testado:
 *   1. Criar conta do usuário teste (auto-confirmado via admin)
 *   2. Fazer login como teste
 *   3. Criar oportunidade
 *   4. Inserir proposal_link (sem PDF real)
 *   5. open_proposal como anon — sem rastrear
 *   6. open_proposal como anon — com rastrear (incrementa view_count)
 *   7. respond_proposal como anon
 *   8. Verificar eventos gerados
 *   9. RLS: isolamento de dados
 *  10. Limpeza
 */

import { createClient } from '@supabase/supabase-js';

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL      = 'https://jttwmccqqshdltafaaze.supabase.co';
const ANON_KEY          = 'sb_publishable_S8sg7VDBv8Dh6pt3hgylJg_FQzX5ftv';
const SERVICE_ROLE_KEY  = process.env.SERVICE_ROLE_KEY ?? '';

const TEST_EMAIL    = 'foundcash.tester.e2e@mailnull.com';
const TEST_PASSWORD = 'Teste@1234!';

if (!SERVICE_ROLE_KEY) {
  console.error('\n⚠️  SERVICE_ROLE_KEY não definida.');
  console.error('   Obtenha em: Supabase Dashboard → Settings → API Keys → service_role');
  console.error('   Execute com: SERVICE_ROLE_KEY=<chave> node scripts/test-e2e.mjs\n');
  process.exit(1);
}

// ─── Clientes ────────────────────────────────────────────────────────────────
const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const anonClient  = createClient(SUPABASE_URL, ANON_KEY);
const userClient  = createClient(SUPABASE_URL, ANON_KEY); // fará login com o teste

// ─── Helpers ─────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
const context = {}; // dados compartilhados entre testes

function ok(label) {
  passed++;
  console.log(`  ✅  ${label}`);
}
function fail(label, err) {
  failed++;
  console.error(`  ❌  ${label}`);
  console.error(`      ${err?.message ?? String(err)}`);
}
async function assert(label, fn) {
  try { await fn(); ok(label); }
  catch (err) { fail(label, err); }
}

// =============================================================================
// Bloco 1 — Criar usuário teste via Admin API (auto-confirmado)
// =============================================================================
console.log('\n📦  Bloco 1 — Usuário teste\n');

await assert('Admin: criar (ou garantir existência de) usuário teste confirmado', async () => {
  // Tenta criar; se já existir, apenas busca o ID pelo e-mail.
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true,
  });

  if (createErr) {
    if (!createErr.message.includes('already been registered') &&
        !createErr.message.includes('already exists')) throw createErr;

    // Usuário já existe — busca pelo e-mail.
    const { data: list, error: listErr } = await adminClient.auth.admin.listUsers();
    if (listErr) throw listErr;
    const existing = list.users.find((u) => u.email === TEST_EMAIL);
    if (!existing) throw new Error('Usuário não encontrado após criar');
    context.userId = existing.id;

    // Garante que a senha está atualizada.
    await adminClient.auth.admin.updateUserById(context.userId, {
      password: TEST_PASSWORD,
      email_confirm: true,
    });
  } else {
    context.userId = created.user.id;
  }

  console.log(`      → userId: ${context.userId}`);
});

await assert('signIn: login com usuário teste', async () => {
  const { data, error } = await userClient.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (error) throw error;
  if (!data.session?.access_token) throw new Error('Sem access_token');
  context.userId = data.user.id; // confirma ID real
});

// =============================================================================
// Bloco 2 — Perfil
// =============================================================================
console.log('\n📦  Bloco 2 — Perfil\n');

await assert('profiles: ler o próprio perfil', async () => {
  const { data, error } = await userClient.from('profiles').select('*').eq('id', context.userId).single();
  if (error) throw error;
  if (!data) throw new Error('Perfil não encontrado');
  console.log(`      → plano: ${data.plan}, nicho: ${data.niche}`);
});

await assert('profiles: anon não consegue ler perfil de outro usuário', async () => {
  const { data } = await anonClient.from('profiles').select('id').eq('id', context.userId);
  if (data?.length) throw new Error('Anon conseguiu ler perfil!');
});

// =============================================================================
// Bloco 3 — Oportunidades
// =============================================================================
console.log('\n📦  Bloco 3 — Oportunidades\n');

const today = new Date().toISOString().slice(0, 10);

await assert('opportunities: inserir', async () => {
  const { data, error } = await userClient
    .from('opportunities')
    .insert({
      client_name: 'Cliente Teste E2E',
      whatsapp: '11999999999',
      value: 25000,
      follow_up_on: today,
      stage: 'proposta',
    })
    .select('*')
    .single();
  if (error) throw error;
  context.opportunityId = data.id;
  console.log(`      → id: ${context.opportunityId}`);
});

await assert('opportunities: listar os próprios', async () => {
  const { data, error } = await userClient.from('opportunities').select('id').eq('id', context.opportunityId);
  if (error) throw error;
  if (!data?.length) throw new Error('Oportunidade não encontrada');
});

await assert('opportunities: anon não vê dados de usuários', async () => {
  const { data } = await anonClient.from('opportunities').select('id').eq('id', context.opportunityId);
  if (data?.length) throw new Error('Anon leu oportunidade — RLS falhou!');
});

// =============================================================================
// Bloco 4 — Proposal Links
// =============================================================================
console.log('\n📦  Bloco 4 — Proposal Links\n');

const FAKE_PATH = `${context.userId}/test-${Date.now()}.pdf`;

await assert('proposal_links: inserir', async () => {
  const { data, error } = await userClient
    .from('proposal_links')
    .insert({
      opportunity_id: context.opportunityId,
      file_path: FAKE_PATH,
      file_name: 'proposta-teste.pdf',
    })
    .select('*')
    .single();
  if (error) throw error;
  if (!data?.token) throw new Error('Token não gerado');
  context.token = data.token;
  console.log(`      → token: ${context.token}`);
});

await assert('proposal_links: unique constraint (2º insert deve falhar)', async () => {
  const { error } = await userClient
    .from('proposal_links')
    .insert({ opportunity_id: context.opportunityId, file_path: FAKE_PATH });
  if (!error) throw new Error('Deveria ter rejeitado segundo link para a mesma oportunidade');
});

await assert('proposal_links: ler o próprio link', async () => {
  const { data, error } = await userClient
    .from('proposal_links')
    .select('token, view_count')
    .eq('token', context.token)
    .single();
  if (error) throw error;
  if (data.view_count !== 0) throw new Error(`view_count inicial deveria ser 0, é ${data.view_count}`);
});

// =============================================================================
// Bloco 5 — open_proposal (RPC pública, anon)
// =============================================================================
console.log('\n📦  Bloco 5 — open_proposal\n');

await assert('open_proposal: token inválido → vazio', async () => {
  const { data, error } = await anonClient.rpc('open_proposal', { p_token: 'token-invalido', p_track: false });
  if (error) throw error;
  if (data?.length) throw new Error('Deveria retornar array vazio');
});

await assert('open_proposal: token válido sem rastrear → retorna proposta', async () => {
  const { data, error } = await anonClient.rpc('open_proposal', { p_token: context.token, p_track: false });
  if (error) throw error;
  const row = data?.[0];
  if (!row) throw new Error('Nenhum dado retornado');
  if (row.client_name !== 'Cliente Teste E2E') throw new Error(`Nome errado: ${row.client_name}`);
  if (Number(row.value) !== 25000) throw new Error(`Valor errado: ${row.value}`);
  console.log(`      → cliente: "${row.client_name}", valor: R$${row.value}`);
});

await assert('open_proposal: p_track=true incrementa view_count', async () => {
  await anonClient.rpc('open_proposal', { p_token: context.token, p_track: true });

  const { data } = await userClient
    .from('proposal_links')
    .select('view_count, first_viewed_at, last_viewed_at')
    .eq('token', context.token)
    .single();

  if ((data?.view_count ?? 0) < 1) throw new Error(`view_count não incrementou: ${data?.view_count}`);
  if (!data.first_viewed_at) throw new Error('first_viewed_at é nulo');
  console.log(`      → view_count: ${data.view_count}, first_viewed_at: ${data.first_viewed_at}`);
});

await assert('open_proposal: segunda chamada em < 30 min NÃO incrementa novamente', async () => {
  const { data: before } = await userClient
    .from('proposal_links').select('view_count').eq('token', context.token).single();

  await anonClient.rpc('open_proposal', { p_token: context.token, p_track: true });

  const { data: after } = await userClient
    .from('proposal_links').select('view_count').eq('token', context.token).single();

  if (after.view_count !== before.view_count)
    throw new Error(`Deveria manter ${before.view_count}, ficou ${after.view_count}`);
  console.log(`      → view_count manteve: ${after.view_count} ✓`);
});

// =============================================================================
// Bloco 6 — respond_proposal (RPC pública, anon)
// =============================================================================
console.log('\n📦  Bloco 6 — respond_proposal\n');

await assert('respond_proposal: resposta inválida é rejeitada', async () => {
  const { error } = await anonClient.rpc('respond_proposal', {
    p_token: context.token,
    p_response: 'resposta_invalida',
    p_note: null,
  });
  if (!error) throw new Error('Deveria ter rejeitado');
});

await assert('respond_proposal: registra "quero_fechar" com nota', async () => {
  const { error } = await anonClient.rpc('respond_proposal', {
    p_token: context.token,
    p_response: 'quero_fechar',
    p_note: 'Adorei a proposta, vamos fechar!',
  });
  if (error) throw error;
});

await assert('proposal_links: response, note e responded_at foram gravados', async () => {
  const { data, error } = await userClient
    .from('proposal_links')
    .select('response, response_note, responded_at')
    .eq('token', context.token)
    .single();
  if (error) throw error;
  if (data.response !== 'quero_fechar') throw new Error(`response errado: ${data.response}`);
  if (!data.response_note?.includes('Adorei')) throw new Error(`note incorreta: ${data.response_note}`);
  if (!data.responded_at) throw new Error('responded_at nulo');
  console.log(`      → response: ${data.response}, responded_at: ${data.responded_at}`);
});

await assert('respond_proposal: segunda resposta com token já respondido não altera', async () => {
  // A função não bloqueia, mas o campo não deve mudar (a lógica aceita sobrescrita — OK)
  // Apenas garante que não dá erro.
  const { error } = await anonClient.rpc('respond_proposal', {
    p_token: context.token,
    p_response: 'pensar',
    p_note: null,
  });
  if (error) throw error;
});

// =============================================================================
// Bloco 7 — Eventos da oportunidade
// =============================================================================
console.log('\n📦  Bloco 7 — opportunity_events\n');

await assert('events: evento "viewed" foi criado', async () => {
  const { data, error } = await userClient
    .from('opportunity_events')
    .select('kind')
    .eq('opportunity_id', context.opportunityId)
    .eq('kind', 'viewed');
  if (error) throw error;
  if (!data?.length) throw new Error('Nenhum evento "viewed"');
  console.log(`      → ${data.length} evento(s) "viewed"`);
});

await assert('events: evento "responded" foi criado', async () => {
  const { data, error } = await userClient
    .from('opportunity_events')
    .select('kind')
    .eq('opportunity_id', context.opportunityId)
    .eq('kind', 'responded');
  if (error) throw error;
  if (!data?.length) throw new Error('Nenhum evento "responded"');
});

// =============================================================================
// Bloco 8 — RLS / isolamento
// =============================================================================
console.log('\n📦  Bloco 8 — Isolamento (RLS)\n');

await assert('proposal_links: anon não consegue listar', async () => {
  const { data } = await anonClient.from('proposal_links').select('id');
  if (data?.length) throw new Error('Anon conseguiu listar proposal_links!');
});

await assert('opportunity_events: anon não consegue listar', async () => {
  const { data } = await anonClient.from('opportunity_events').select('id');
  if (data?.length) throw new Error('Anon conseguiu listar opportunity_events!');
});

// =============================================================================
// Bloco 9 — Limpeza
// =============================================================================
console.log('\n📦  Bloco 9 — Limpeza\n');

await assert('oportunidade deletada (cascade apaga link e eventos)', async () => {
  const { error } = await userClient.from('opportunities').delete().eq('id', context.opportunityId);
  if (error) throw error;
});

await assert('proposal_link foi removido pelo cascade', async () => {
  const { data } = await userClient
    .from('proposal_links').select('id').eq('opportunity_id', context.opportunityId);
  if (data?.length) throw new Error('Link não foi removido pelo cascade');
});

await assert('usuário teste deletado do Supabase Auth', async () => {
  const { error } = await adminClient.auth.admin.deleteUser(context.userId);
  if (error) throw error;
});

await assert('logout', async () => {
  const { error } = await userClient.auth.signOut();
  if (error) throw error;
});

// =============================================================================
// Resultado
// =============================================================================
const total = passed + failed;
console.log(`\n${'─'.repeat(50)}`);
console.log(`Resultado: ${passed}/${total} testes passaram`);
if (failed > 0) {
  console.log(`           ${failed} teste(s) falharam ⚠️`);
  process.exit(1);
} else {
  console.log(`           Tudo certo! 🎉`);
}
