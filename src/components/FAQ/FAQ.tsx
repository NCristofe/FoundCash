import { useState } from 'react';
import { Plus } from 'lucide-react';
import { faqItems } from '../../data/content';
import { Reveal } from '../common/Reveal';
import './FAQ.css';

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => setOpenIndex((current) => (current === index ? null : index));

  return (
    <section id="faq" className="section faq" aria-labelledby="faq-titulo">
      <div className="container faq-grid">
        <Reveal className="faq-intro">
          <p className="eyebrow">FAQ</p>
          <h2 id="faq-titulo" className="faq-title">
            Perguntas frequentes
          </h2>
          <p className="faq-lead">Tudo o que você precisa saber antes de começar a acompanhar suas oportunidades.</p>
        </Reveal>

        <div className="faq-list">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            const buttonId = `faq-pergunta-${index}`;
            const panelId = `faq-resposta-${index}`;

            return (
              <div key={item.question} className={`faq-item ${isOpen ? 'is-open' : ''}`}>
                <h3 className="faq-question">
                  <button
                    id={buttonId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => toggle(index)}
                  >
                    <span>{item.question}</span>
                    <Plus className="faq-icon" size={20} aria-hidden="true" />
                  </button>
                </h3>
                <div id={panelId} role="region" aria-labelledby={buttonId} className="faq-answer" hidden={!isOpen}>
                  <p>{item.answer}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
