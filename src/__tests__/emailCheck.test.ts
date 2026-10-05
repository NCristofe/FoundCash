import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkEmail } from '../utils/emailCheck';

function mockDns(body: unknown, ok = true) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok, json: async () => body }));
}

afterEach(() => vi.unstubAllGlobals());

describe('checkEmail', () => {
  it('bloqueia domínios descartáveis sem consultar o DNS', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const result = await checkEmail('x@mailinator.com');
    expect(result.status).toBe('invalid');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('sugere correção para erros de digitação comuns', async () => {
    const result = await checkEmail('joao@gmial.com');
    expect(result).toMatchObject({ status: 'typo', suggestion: 'joao@gmail.com' });
  });

  it('não sugere nada para domínios conhecidos', async () => {
    mockDns({ Status: 0, Answer: [{}] });
    expect((await checkEmail('joao@gmail.com')).status).toBe('ok');
  });

  it('rejeita domínio inexistente (NXDOMAIN)', async () => {
    mockDns({ Status: 3 });
    expect((await checkEmail('a@empresa-que-nao-existe-xyz.com.br')).status).toBe('invalid');
  });

  it('rejeita domínio sem registro MX', async () => {
    mockDns({ Status: 0 });
    expect((await checkEmail('a@semmx.com.br')).status).toBe('invalid');
  });

  it('aceita domínio com MX', async () => {
    mockDns({ Status: 0, Answer: [{ data: '10 mx.empresa.com.br.' }] });
    expect((await checkEmail('a@empresa.com.br')).status).toBe('ok');
  });

  it('falha aberta quando o DNS não responde', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));
    expect((await checkEmail('a@empresa.com.br')).status).toBe('ok');
  });

  it('falha aberta em resposta HTTP de erro', async () => {
    mockDns({}, false);
    expect((await checkEmail('a@empresa.com.br')).status).toBe('ok');
  });

  it('rejeita texto sem domínio', async () => {
    expect((await checkEmail('semarroba')).status).toBe('invalid');
  });
});
