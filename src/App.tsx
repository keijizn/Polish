import { useEffect, useState } from 'react';


// ==========================================
// TIPOS
// ==========================================

type Change = {
  before: string;
  after: string;
  reason: string;
};

type CorrectionResult = {
  original: string;
  corrected: string;
  changes: Change[];
  error?: string;
};


// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

function App() {


  // ==========================================
  // CONTROLE DE TELA
  // ==========================================

  const [screen, setScreen] = useState<
    | 'home'
    | 'correction'
    | 'tone'
    | 'tone-result'
    | 'translate'
    | 'translate-result'
    | 'notes'
    | 'settings'
  >('home');

  // ==========================================
  // TOAST DE AVISO
  // ==========================================
  const [toast, setToast] = useState<{
    message: string;
    type: 'error' | 'success' | 'info';
  } | null>(null);
  // ==========================================
  // TEMA
  // ==========================================

  const [theme, setTheme] =
    useState<'dark' | 'light' | 'system'>('dark');

  const [systemTheme, setSystemTheme] =
    useState<'dark' | 'light'>('dark');


  // ==========================================
  // INTELIGÊNCIA ARTIFICIAL
  // ==========================================

  const [aiProvider, setAiProvider] =
    useState<'gemini' | 'openai' | 'anthropic'>('gemini');

  const [geminiKey, setGeminiKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');


  // ==========================================
  // TEXTO PRINCIPAL
  // ==========================================

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);


  // ==========================================
  // TONALIDADE
  // ==========================================

  const [toneResult, setToneResult] =
    useState<{
      original: string;
      rewritten: string;
      tone: string;
      error?: string;
    } | null>(null);

  const [selectedTone, setSelectedTone] =
    useState('');


  // ==========================================
  // TRADUÇÃO
  // ==========================================

  const [
    translationResult,
    setTranslationResult,
  ] = useState<{
    original: string;
    translated: string;
    language: string;
    error?: string;
  } | null>(null);

  const [
    selectedLanguage,
    setSelectedLanguage,
  ] = useState('');


  // ==========================================
  // CORREÇÃO
  // ==========================================

  const [correction, setCorrection] =
    useState<CorrectionResult | null>(null);


  // ==========================================
  // NOTAS
  // ==========================================

  const [notes, setNotes] = useState<{
    id: number;
    content: string;
    created_at: string;
  }[]>([]);


  // ==========================================
  // DETECTAR TEMA DO WINDOWS
  // ==========================================

  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        '(prefers-color-scheme: dark)'
      );

    const updateSystemTheme = () => {
      setSystemTheme(
        mediaQuery.matches
          ? 'dark'
          : 'light'
      );
    };

    updateSystemTheme();

    mediaQuery.addEventListener(
      'change',
      updateSystemTheme
    );

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateSystemTheme
      );
    };
  }, []);


  // ==========================================
  // TEMA ATIVO
  // ==========================================

  const activeTheme =
    theme === 'system'
      ? systemTheme
      : theme;


  // ==========================================
  // ALTERAR TONALIDADE
  // ==========================================

  const handleTone = async (
    tone: string
  ) => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);
    setSelectedTone(tone);

    try {
      const result =
        await window.polishAPI.changeTone(
          text,
          tone,
          aiProvider
        );

      if (result.error) {
        console.error(result.error);

        showToast(
          result.error,
          'error'
        );

        return;
      }

      setToneResult(result);
      setScreen('tone-result');

    } catch (error) {
      console.error(
        'Erro ao mudar tonalidade:',
        error
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // TRADUZIR TEXTO
  // ==========================================

  const handleTranslation = async (
    language: string
  ) => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);
    setSelectedLanguage(language);

    try {
      const result =
        await window.polishAPI.translateText(
          text,
          language,
          aiProvider
        );

      if (result.error) {
        console.error(result.error);

        showToast(
          result.error,
          'error'
        );

        return;
      }

      setTranslationResult(result);
      setScreen('translate-result');

    } catch (error) {
      console.error(
        'Erro ao traduzir:',
        error
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // ABRIR NOTAS
  // ==========================================

  const handleOpenNotes = async () => {
    try {
      const result =
        await window.polishAPI.getNotes();

      if (result.error) {
        console.error(result.error);
        return;
      }

      setNotes(result.notes);
      setScreen('notes');

    } catch (error) {
      console.error(
        'Erro ao carregar notas:',
        error
      );
    }
  };


  // ==========================================
  // CORRIGIR TEXTO
  // ==========================================

  const handleCorrectText = async () => {
    if (!text.trim() || loading) {
      return;
    }

    setLoading(true);

    try {
      const result =
        await window.polishAPI.correctText(
          text,
          aiProvider
        );

      console.log(
        'RESULTADO:',
        result
      );

      if (result.error) {
        console.error(
          'ERRO:',
          result.error
        );

        showToast(
          result.error,
          'error'
        );

        return;
      }

      setCorrection(result);
      setScreen('correction');

    } catch (error) {
      console.error(
        'Erro ao corrigir:',
        error
      );

    } finally {
      setLoading(false);
    }
  };


  // ==========================================
  // SALVAR NOTA
  // ==========================================

  const handleSaveNote = async () => {
    if (!text.trim()) {
      return;
    }

    try {
      const result =
        await window.polishAPI.saveNote(
          text
        );

      console.log(
        'NOTA SALVA:',
        result
      );

      if (result.error) {
        console.error(result.error);

        showToast(
          result.error,
          'error'
        );

        return;
      }

      setText('');

      showToast(
        'Nota salva com sucesso.',
        'success'
      );

    } catch (error) {
      console.error(
        'Erro ao salvar nota:',
        error
      );
    }
  };


  // ==========================================
  // ATALHOS INTERNOS
  // ==========================================

  useEffect(() => {
    const handleShortcut = (
      event: KeyboardEvent
    ) => {
      if (!event.ctrlKey) {
        return;
      }

      switch (
      event.key.toLowerCase()
      ) {

        // Ctrl + 1
        // Corrigir texto

        case '1':
          event.preventDefault();
          handleCorrectText();
          break;


        // Ctrl + 2
        // Abrir tonalidade

        case '2':
          event.preventDefault();
          setScreen('tone');
          break;


        // Ctrl + 3
        // Abrir tradução

        case '3':
          event.preventDefault();
          setScreen('translate');
          break;


        // Ctrl + S
        // Salvar nota

        case 's':
          event.preventDefault();
          handleSaveNote();
          break;


        // Ctrl + N
        // Abrir notas

        case 'n':
          event.preventDefault();
          handleOpenNotes();
          break;
      }
    };

    window.addEventListener(
      'keydown',
      handleShortcut
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handleShortcut
      );
    };

  }, [text, loading]);

  // ==========================================
  // AVISOS DE ERRO
  // ==========================================

  const showToast = (
    message: string,
    type: 'error' | 'success' | 'info' = 'info'
  ) => {
    setToast({
      message,
      type,
    });

    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const Toast = () => {
    if (!toast) {
      return null;
    }

    return (
      <div
        className={`toast toast-${toast.type}`}
      >
        {toast.message}
      </div>
    );
  };
  // ==========================================
  // TELA DE CONFIGURAÇÕES
  // ==========================================

  if (screen === 'settings') {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              CONFIGURAÇÕES
          ========================================== */}

          <div className="settings-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen('home')
              }
            >
              ← Voltar
            </button>

            <h2>
              Configurações
            </h2>


            {/* ==========================================
                APARÊNCIA
            ========================================== */}

            <div className="settings-section">

              <h3>
                Aparência
              </h3>

              <button
                className={`setting-option ${theme === 'dark'
                  ? 'selected'
                  : ''
                  }`}
                onClick={() =>
                  setTheme('dark')
                }
              >
                🌙 Escuro
              </button>

              <button
                className={`setting-option ${theme === 'light'
                  ? 'selected'
                  : ''
                  }`}
                onClick={() =>
                  setTheme('light')
                }
              >
                ☀️ Claro
              </button>

              <button
                className={`setting-option ${theme === 'system'
                  ? 'selected'
                  : ''
                  }`}
                onClick={() =>
                  setTheme('system')
                }
              >
                💻 Sistema
              </button>

            </div>


            {/* ==========================================
                INTELIGÊNCIA ARTIFICIAL
            ========================================== */}

            <div className="settings-section">

              <h3>
                IA
              </h3>

              <button
                className={`setting-option ${aiProvider === 'gemini' ? 'selected' : ''}`}
                onClick={() => setAiProvider('gemini')}
              >
                ✨ Gemini
              </button>

              <button
                className={`setting-option ${aiProvider === 'openai' ? 'selected' : ''}`}
                onClick={() => setAiProvider('openai')}
              >
                OpenAI
              </button>

              <button
                className="setting-option"
                disabled
              >
                Anthropic
              </button>

            </div>


            {/* ==========================================
                CHAVES DE API
            ========================================== */}

            <div className="settings-section">
              <h3>Chaves de API</h3>

              <label className="settings-label" htmlFor="gemini-key">
                Gemini
              </label>
              <input
                id="gemini-key"
                className="settings-input"
                type="password"
                value={geminiKey}
                onChange={(event) => setGeminiKey(event.target.value)}
                placeholder="Cole sua chave do Gemini"
                autoComplete="off"
              />

              <label className="settings-label" htmlFor="openai-key">
                OpenAI
              </label>
              <input
                id="openai-key"
                className="settings-input"
                type="password"
                value={openaiKey}
                onChange={(event) => setOpenaiKey(event.target.value)}
                placeholder="Cole sua chave da OpenAI"
                autoComplete="off"
              />

              <button
                className="save-keys-button"
                onClick={async () => {
                  try {
                    const result = await window.polishAPI.saveApiKeys({
                      gemini: geminiKey,
                      openai: openaiKey,
                    });

                    if (!result.success) {
                      showToast(result.error || 'Não foi possível salvar as chaves.', 'error');
                      return;
                    }

                    showToast('Chaves salvas com sucesso.', 'success');
                  } catch (error) {
                    console.error('Erro ao salvar chaves:', error);
                    showToast('Não foi possível salvar as chaves.', 'error');
                  }
                }}
              >
                Salvar chaves
              </button>
            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // TELA DE NOTAS
  // ==========================================

  if (screen === 'notes') {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              CONTEÚDO DAS NOTAS
          ========================================== */}

          <div className="correction-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen('home')
              }
            >
              ← Voltar
            </button>

            <h2>
              Notas
            </h2>

            <div className="notes-list">

              {notes.length === 0 ? (

                <div className="change-item">
                  Nenhuma nota salva.
                </div>

              ) : (

                notes.map(
                  (note) => (

                    <div
                      className="note-item"
                      key={note.id}
                    >

                      <div className="note-content">
                        {note.content}
                      </div>

                      <div className="note-bottom">

                        <div className="note-date">

                          {new Date(
                            note.created_at
                          ).toLocaleString(
                            'pt-BR'
                          )}

                        </div>


                        {/* ==========================================
                            AÇÕES DA NOTA
                        ========================================== */}

                        <div className="note-actions">

                          <button
                            className="note-action-button"
                            onClick={() => {
                              navigator.clipboard.writeText(
                                note.content
                              );
                              showToast('Nota copiada!', 'success');
                            }}
                          >
                            Copiar
                          </button>

                          <button
                            className="note-action-button delete"
                            onClick={
                              async () => {

                                const result =
                                  await window.polishAPI.deleteNote(
                                    note.id
                                  );

                                if (result.error) {
                                  console.error(
                                    result.error
                                  );

                                  return;
                                }

                                showToast('Nota excluída!', 'error');

                                setNotes(
                                  (
                                    currentNotes
                                  ) =>
                                    currentNotes.filter(
                                      (
                                        currentNote
                                      ) =>
                                        currentNote.id !==
                                        note.id
                                    )
                                );
                              }
                            }
                          >
                            Excluir
                          </button>

                        </div>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // RESULTADO DA TRADUÇÃO
  // ==========================================

  if (
    screen ===
    'translate-result'
  ) {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              RESULTADO
          ========================================== */}

          <div className="correction-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen(
                  'translate'
                )
              }
            >
              ← Voltar
            </button>

            <h2>
              Tradução:{' '}
              {
                translationResult
                  ?.language
              }
            </h2>

            <div className="comparison">

              <div className="text-box original-box">

                <span className="box-title">
                  Original
                </span>

                <p className="original-text">
                  {
                    translationResult
                      ?.original
                  }
                </p>

              </div>

              <div className="text-box corrected-box">

                <span className="box-title">
                  Traduzido
                </span>

                <p className="corrected-text">
                  {
                    translationResult
                      ?.translated
                  }
                </p>

              </div>

            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // TELA DE TRADUÇÃO
  // ==========================================

  if (screen === 'translate') {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              IDIOMAS
          ========================================== */}

          <div className="tone-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen('home')
              }
            >
              ← Voltar
            </button>

            <h2>
              Traduzir
            </h2>

            <div className="tone-options">

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Inglês'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Inglês'
                  ? '⏳ Traduzindo...'
                  : '🇺🇸 Inglês'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Espanhol'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Espanhol'
                  ? '⏳ Traduzindo...'
                  : '🇪🇸 Espanhol'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Francês'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Francês'
                  ? '⏳ Traduzindo...'
                  : '🇫🇷 Francês'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Alemão'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Alemão'
                  ? '⏳ Traduzindo...'
                  : '🇩🇪 Alemão'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Italiano'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Italiano'
                  ? '⏳ Traduzindo...'
                  : '🇮🇹 Italiano'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Português'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Português'
                  ? '⏳ Traduzindo...'
                  : '🇵🇹 Português'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Japonês'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Japonês'
                  ? '⏳ Traduzindo...'
                  : '🇯🇵 Japonês'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTranslation(
                    'Coreano'
                  )
                }
              >
                {loading &&
                  selectedLanguage ===
                  'Coreano'
                  ? '⏳ Traduzindo...'
                  : '🇰🇷 Coreano'}
              </button>

            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // RESULTADO DA TONALIDADE
  // ==========================================

  if (
    screen ===
    'tone-result'
  ) {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              RESULTADO
          ========================================== */}

          <div className="correction-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen('tone')
              }
            >
              ← Voltar
            </button>

            <h2>
              Tom:{' '}
              {toneResult?.tone}
            </h2>

            <div className="comparison">

              <div className="text-box original-box">

                <span className="box-title">
                  Original
                </span>

                <p className="original-text">
                  {toneResult?.original}
                </p>

              </div>

              <div className="text-box corrected-box">

                <span className="box-title">
                  Reescrito
                </span>

                <p className="corrected-text">
                  {toneResult?.rewritten}
                </p>

              </div>

            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // TELA DE TONALIDADE
  // ==========================================

  if (screen === 'tone') {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              OPÇÕES DE TONALIDADE
          ========================================== */}

          <div className="tone-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen('home')
              }
            >
              ← Voltar
            </button>

            <h2>
              Mudar tonalidade
            </h2>

            <div className="tone-options">

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTone(
                    'Profissional'
                  )
                }
              >
                {loading &&
                  selectedTone ===
                  'Profissional'
                  ? '⏳ Reescrevendo...'
                  : '💼 Profissional'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTone(
                    'Casual'
                  )
                }
              >
                {loading &&
                  selectedTone ===
                  'Casual'
                  ? '⏳ Reescrevendo...'
                  : '☕ Casual'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTone(
                    'Amigável'
                  )
                }
              >
                {loading &&
                  selectedTone ===
                  'Amigável'
                  ? '⏳ Reescrevendo...'
                  : '😊 Amigável'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTone(
                    'Conciso'
                  )
                }
              >
                {loading &&
                  selectedTone ===
                  'Conciso'
                  ? '⏳ Reescrevendo...'
                  : '⚡ Conciso'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTone(
                    'Persuasivo'
                  )
                }
              >
                {loading &&
                  selectedTone ===
                  'Persuasivo'
                  ? '⏳ Reescrevendo...'
                  : '📢 Persuasivo'}
              </button>

              <button
                className="tone-button"
                disabled={loading}
                onClick={() =>
                  handleTone(
                    'Brincalhão'
                  )
                }
              >
                {loading &&
                  selectedTone ===
                  'Brincalhão'
                  ? '⏳ Reescrevendo...'
                  : '🎉 Brincalhão'}
              </button>

            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // TELA DE CORREÇÃO
  // ==========================================

  if (screen === 'correction') {
    return (
      <div
        className={`app theme-${activeTheme}`}
      >
        <div className="polish-window">

          {/* ==========================================
              BARRA SUPERIOR
          ========================================== */}

          <div className="title-bar">

            <span className="title">
              Polish
            </span>

            <button
              className="close-button"
              onClick={() =>
                window.close()
              }
            >
              ×
            </button>

          </div>


          {/* ==========================================
              RESULTADO DA CORREÇÃO
          ========================================== */}

          <div className="correction-screen">

            <button
              className="back-button"
              onClick={() =>
                setScreen('home')
              }
            >
              ← Voltar
            </button>

            <h2>
              Correção
            </h2>

            <div className="comparison">

              <div className="text-box original-box">

                <span className="box-title">
                  Original
                </span>

                <p className="original-text">
                  {correction?.original}
                </p>

              </div>

              <div className="text-box corrected-box">

                <span className="box-title">
                  Corrigido
                </span>

                <p className="corrected-text">
                  {correction?.corrected}
                </p>

              </div>

            </div>


            {/* ==========================================
                ALTERAÇÕES REALIZADAS
            ========================================== */}

            <div className="changes">

              <h3>
                Alterações
              </h3>

              {correction?.changes.length ===
                0 ? (

                <div className="change-item">
                  Nenhuma alteração necessária.
                </div>

              ) : (

                correction?.changes.map(
                  (
                    change,
                    index
                  ) => (

                    <div
                      className="change-item"
                      key={index}
                    >

                      <div>

                        <strong>
                          {change.before}
                        </strong>

                        {' → '}

                        <strong>
                          {change.after}
                        </strong>

                      </div>

                      <div className="change-reason">
                        {change.reason}
                      </div>

                    </div>

                  )
                )

              )}

            </div>

          </div>


          {/* ==========================================
              RODAPÉ
          ========================================== */}

          <div className="footer">

            <span>
              Polish v0.1
            </span>

            <span>
              Esc para ocultar
            </span>

          </div>

          <Toast />

        </div>
      </div>
    );
  }


  // ==========================================
  // TELA PRINCIPAL
  // ==========================================

  return (
    <div
      className={`app theme-${activeTheme}`}
    >
      <div className="polish-window">


        {/* ==========================================
            BARRA SUPERIOR
        ========================================== */}

        <div className="title-bar">

          <span className="title">
            Polish
          </span>

          <button
            className="close-button"
            onClick={() =>
              window.close()
            }
          >
            ×
          </button>

        </div>


        {/* ==========================================
            CAMPO DE TEXTO
        ========================================== */}

        <textarea
          className="text-input"
          placeholder="Digite seu texto..."
          value={text}
          onChange={(event) => {
            setText(
              event.target.value
            );
          }}
        />


        {/* ==========================================
            MENU DE OPÇÕES
        ========================================== */}

        <div className="options">


          {/* ==========================================
              CORRIGIR TEXTO
          ========================================== */}

          <button
            className="option-button"
            disabled={loading}
            onClick={handleCorrectText}
          >

            <span className="option-icon">
              {loading
                ? '⏳'
                : '✨'}
            </span>

            <span>
              {loading
                ? 'Corrigindo...'
                : 'Corrigir texto'}
            </span>

            <span className="shortcut">
              {loading
                ? ''
                : 'Ctrl + 1'}
            </span>

          </button>


          {/* ==========================================
              MUDAR TONALIDADE
          ========================================== */}

          <button
            className="option-button"
            onClick={() =>
              setScreen('tone')
            }
          >

            <span className="option-icon">
              🎭
            </span>

            <span>
              Mudar tonalidade
            </span>

            <span className="shortcut">
              Ctrl + 2
            </span>

          </button>


          {/* ==========================================
              TRADUZIR
          ========================================== */}

          <button
            className="option-button"
            onClick={() =>
              setScreen('translate')
            }
          >

            <span className="option-icon">
              🌐
            </span>

            <span>
              Traduzir
            </span>

            <span className="shortcut">
              Ctrl + 3
            </span>

          </button>


          {/* ==========================================
              SALVAR NOTA
          ========================================== */}

          <button
            className="option-button"
            onClick={handleSaveNote}
          >

            <span className="option-icon">
              📝
            </span>

            <span>
              Salvar nota
            </span>

            <span className="shortcut">
              Ctrl + S
            </span>

          </button>


          {/* ==========================================
              ABRIR NOTAS
          ========================================== */}

          <button
            className="option-button"
            onClick={handleOpenNotes}
          >

            <span className="option-icon">
              📚
            </span>

            <span>
              Abrir notas
            </span>

            <span className="shortcut">
              Ctrl + N
            </span>

          </button>


          {/* ==========================================
              CONFIGURAÇÕES
          ========================================== */}

          <button
            className="option-button"
            onClick={() =>
              setScreen('settings')
            }
          >

            <span className="option-icon">
              ⚙
            </span>

            <span>
              Configurações
            </span>

            <span className="shortcut">
            </span>

          </button>


        </div>


        {/* ==========================================
    RODAPÉ
========================================== */}

        <div className="footer">
          <span>
            Polish v0.1
          </span>

          <span>
            Esc para ocultar
          </span>
        </div>


        {/* ==========================================
    TOAST
========================================== */}

        <Toast />


      </div>
    </div>
  );
}


// ==========================================
// EXPORT
// ==========================================

export default App;