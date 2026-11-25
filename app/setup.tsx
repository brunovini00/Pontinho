import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { INITIAL_POINTS, MAX_PLAYERS, NAME_LIMIT } from "./game";
import ScreenShuffle from "./screen-shuffle";

export function Brand() {
  return (
    <div className="brand">
      <span className="brand-mark" aria-hidden="true">♠</span>
      <span>Pontinho<span className="brand-dot">.</span></span>
    </div>
  );
}

export default function Setup({ initialNames, focusTitle, onStart }: {
  initialNames: string[];
  focusTitle: boolean;
  onStart: (names: string[]) => void;
}) {
  const [names, setNames] = useState(() => initialNames.map((name, id) => ({ name, id })));
  const nextId = useRef(names.length);
  const newField = useRef<number | null>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const count = names.filter(({ name }) => name.trim()).length;

  useEffect(() => {
    if (focusTitle) title.current?.focus({ preventScroll: true });
  }, [focusTitle]);

  function addPlayer() {
    if (names.length >= MAX_PLAYERS) return;
    const id = nextId.current++;
    newField.current = id;
    setNames([...names, { id, name: "" }]);
  }

  function start(event: FormEvent) {
    event.preventDefault();
    if (count >= 2) onStart(names.map(({ name }) => name.trim()).filter(Boolean));
  }

  return (
    <main className="shell setup">
      <ScreenShuffle />
      <header className="site-header"><Brand /></header>
      <section className="table-banner" aria-labelledby="setup-title">
        <div className="banner-copy">
          <h1 ref={title} id="setup-title" tabIndex={-1}>Monte sua<br />mesa.</h1>
          <p>O último jogador na mesa vence.</p>
        </div>
        <div className="deck" aria-hidden="true">
          <div className="deck-back" />
          <div className="deck-front"><span>A</span><b>♠</b><span>A</span></div>
        </div>
      </section>
      <form className="setup-form" onSubmit={start}>
        <div className="section-heading">
          <div><h2>Jogadores</h2><p>De 2 a {MAX_PLAYERS} pessoas · {INITIAL_POINTS} pontos iniciais</p></div>
          <strong className="count" aria-label={`${count} de ${MAX_PLAYERS} jogadores`}>{count}/{MAX_PLAYERS}</strong>
        </div>
        <ul className="name-list">
          {names.map(({ name, id }, index) => (
            <li className="name-row" key={id} data-dealt={id >= initialNames.length}>
              <span className="name-index" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              <input
                ref={(input) => {
                  if (input && newField.current === id) {
                    newField.current = null;
                    input.focus();
                  }
                }}
                aria-label={`Nome do jogador ${index + 1}`}
                placeholder={`Nome do jogador ${index + 1}`}
                value={name}
                maxLength={NAME_LIMIT}
                autoCapitalize="words"
                autoComplete="off"
                onChange={(event) => {
                  const value = event.target.value;
                  setNames((current) => current.map((entry) => entry.id === id ? { ...entry, name: value } : entry));
                }}
              />
              {names.length > 2 && (
                <button
                  type="button"
                  className="icon-button remove-player"
                  aria-label={`Remover ${name.trim() || `jogador ${index + 1}`}`}
                  onClick={() => setNames(names.filter((entry) => entry.id !== id))}
                >×</button>
              )}
            </li>
          ))}
        </ul>
        {names.length < MAX_PLAYERS && (
          <button className="button add-player" type="button" onClick={addPlayer}><span aria-hidden="true">+</span> Adicionar jogador</button>
        )}
        <button className="button primary setup-submit" disabled={count < 2}>Começar partida</button>
      </form>
    </main>
  );
}
