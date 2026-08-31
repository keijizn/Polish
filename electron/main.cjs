require('dotenv').config();

const {
  app,
  BrowserWindow,
  Menu,
  globalShortcut,
  ipcMain,
  safeStorage,
} = require('electron');

const path = require('path');
const fs = require('fs');
const { GoogleGenAI } = require('@google/genai');
const OpenAI = require('openai');

const {
  saveNote,
  getNotes,
  deleteNote,
} = require('./database.cjs');


// ==========================================
// CLIENTES DE IA
// ==========================================



// ==========================================
// JANELA PRINCIPAL
// ==========================================

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 720,
    height: 500,
    autoHideMenuBar: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    center: true,

    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  Menu.setApplicationMenu(null);

  if (app.isPackaged) {
    win.loadFile(
      path.join(__dirname, '../dist/index.html')
    );
  } else {
    win.loadURL('http://localhost:5173');
  }

  // Ative novamente se precisar depurar:
  // win.webContents.openDevTools();

  win.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'Escape') {
      event.preventDefault();
      win.hide();
    }
  });

  win.on('blur', () => {
    win.hide();
  });

  win.on('close', (event) => {
    if (!app.isQuiting) {
      event.preventDefault();
      win.hide();
    }
  });
}


// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

// ==========================================
// CHAVES DE API
// ==========================================

function getApiKeysPath() {
  return path.join(
    app.getPath('userData'),
    'api-keys.json'
  );
}


function saveApiKeys(keys) {

  const data = {
    gemini: keys.gemini
      ? safeStorage
        .encryptString(keys.gemini)
        .toString('base64')
      : '',

    openai: keys.openai
      ? safeStorage
        .encryptString(keys.openai)
        .toString('base64')
      : '',
  };

  fs.writeFileSync(
    getApiKeysPath(),
    JSON.stringify(data, null, 2),
    'utf-8'
  );
}


function loadApiKeys() {

  const filePath =
    getApiKeysPath();

  if (!fs.existsSync(filePath)) {
    return {
      gemini: '',
      openai: '',
    };
  }

  const data =
    JSON.parse(
      fs.readFileSync(
        filePath,
        'utf-8'
      )
    );

  return {

    gemini: data.gemini
      ? safeStorage.decryptString(
        Buffer.from(
          data.gemini,
          'base64'
        )
      )
      : '',

    openai: data.openai
      ? safeStorage.decryptString(
        Buffer.from(
          data.openai,
          'base64'
        )
      )
      : '',
  };
}

function getGeminiClient() {
  const keys = loadApiKeys();

  const apiKey =
    keys.gemini ||
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new GoogleGenAI({
    apiKey,
  });
}


function getOpenAIClient() {
  const keys = loadApiKeys();

  const apiKey =
    keys.openai ||
    process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  return new OpenAI({
    apiKey,
  });
}

function cleanJsonResponse(raw) {
  return raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
}

function normalizeProvider(provider) {
  if (
    provider === 'gemini' ||
    provider === 'openai' ||
    provider === 'anthropic'
  ) {
    return provider;
  }

  return 'gemini';
}

function getAIErrorMessage(error, provider) {
  const message = error?.message || '';
  const status = error?.status;

  if (
    status === 401 ||
    message.includes('401') ||
    message.includes('invalid_api_key') ||
    message.toLowerCase().includes('api key not valid')
  ) {
    return `A chave da ${provider === 'openai' ? 'OpenAI' : 'Gemini'
      } é inválida ou não está configurada.`;
  }

  if (
    status === 429 ||
    message.includes('429') ||
    message.includes('RESOURCE_EXHAUSTED') ||
    message.includes('insufficient_quota')
  ) {
    return 'Limite temporário da API atingido ou créditos indisponíveis. Tente novamente mais tarde.';
  }

  if (
    status === 404 ||
    message.includes('404') ||
    message.includes('NOT_FOUND')
  ) {
    return 'O modelo selecionado não está disponível no momento.';
  }

  if (
    status === 503 ||
    message.includes('503') ||
    message.includes('UNAVAILABLE')
  ) {
    return 'O modelo está temporariamente sobrecarregado. Tente novamente em instantes.';
  }

  return message || 'Ocorreu um erro inesperado ao acessar a IA.';
}


// ==========================================
// INICIALIZAÇÃO DO ELECTRON
// ==========================================

app.whenReady().then(() => {

  // ==========================================
  // SALVAR CHAVES DE API
  // ==========================================

  ipcMain.handle(
    'save-api-keys',
    async (_event, keys) => {
      try {

        saveApiKeys({
          gemini:
            keys.gemini?.trim() || '',

          openai:
            keys.openai?.trim() || '',
        });

        return {
          success: true,
        };

      } catch (error) {

        console.error(
          'ERRO AO SALVAR CHAVES:',
          error
        );

        return {
          success: false,
          error:
            'Não foi possível salvar as chaves.',
        };
      }
    }
  );


  // ==========================================
  // BUSCAR CHAVES DE API
  // ==========================================

  ipcMain.handle(
    'get-api-keys',
    async () => {
      try {

        const keys =
          loadApiKeys();

        return {
          success: true,
          gemini: keys.gemini,
          openai: keys.openai,
        };

      } catch (error) {

        console.error(
          'ERRO AO BUSCAR CHAVES:',
          error
        );

        return {
          success: false,
          gemini: '',
          openai: '',
          error:
            'Não foi possível carregar as chaves.',
        };
      }
    }
  );

  // ==========================================
  // CORREÇÃO DE TEXTO
  // ==========================================

  ipcMain.handle(
    'correct-text',
    async (_event, text, provider) => {
      const selectedProvider = normalizeProvider(provider);

      if (!text || !text.trim()) {
        return {
          original: text,
          corrected: '',
          changes: [],
          error: 'Digite um texto antes de corrigir.',
        };
      }

      if (selectedProvider === 'gemini') {
        const gemini = getGeminiClient();

        if (!gemini) {
          return {
            original: text,
            corrected: '',
            changes: [],
            error:
              'Gemini não está configurado. Adicione sua chave nas Configurações.',
          };
        }

        try {
          const response =
            await gemini.models.generateContent({
              model: 'gemini-3.5-flash-lite',

              contents: `
Você é um corretor de textos.

Corrija apenas erros ortográficos, gramaticais, de pontuação e concordância.

Preserve ao máximo:
- o significado original;
- o estilo de escrita;
- o nível de formalidade;
- a intenção do autor.

Retorne SOMENTE um JSON válido neste formato:

{
  "corrected": "texto corrigido",
  "changes": [
    {
      "before": "trecho original",
      "after": "trecho corrigido",
      "reason": "motivo curto da alteração"
    }
  ]
}

Se não houver alterações, retorne:

{
  "corrected": "texto original",
  "changes": []
}

Texto:
${text}
              `,
            });

          const cleaned =
            cleanJsonResponse(response.text.trim());

          const result =
            JSON.parse(cleaned);

          return {
            original: text,
            corrected: result.corrected,
            changes: result.changes || [],
          };

        } catch (error) {
          console.error(
            'ERRO GEMINI - CORREÇÃO:',
            error
          );

          return {
            original: text,
            corrected: '',
            changes: [],
            error: getAIErrorMessage(
              error,
              'gemini'
            ),
          };
        }
      }

      if (selectedProvider === 'openai') {
        const openai = getOpenAIClient();

        if (!openai) {
          return {
            original: text,
            corrected: '',
            changes: [],
            error:
              'OpenAI não está configurada. Adicione sua chave nas Configurações.',
          };
        }

        try {
          const response =
            await openai.responses.create({
              model: 'gpt-5.6-luna',

              input: `
Você é um corretor de textos.

Corrija apenas erros ortográficos, gramaticais, de pontuação e concordância.

Preserve ao máximo:
- o significado original;
- o estilo de escrita;
- o nível de formalidade;
- a intenção do autor.

Retorne SOMENTE um JSON válido neste formato:

{
  "corrected": "texto corrigido",
  "changes": [
    {
      "before": "trecho original",
      "after": "trecho corrigido",
      "reason": "motivo curto da alteração"
    }
  ]
}

Se não houver alterações, retorne:

{
  "corrected": "texto original",
  "changes": []
}

Texto:
${text}
              `,
            });

          const cleaned =
            cleanJsonResponse(
              response.output_text.trim()
            );

          const result =
            JSON.parse(cleaned);

          return {
            original: text,
            corrected: result.corrected,
            changes: result.changes || [],
          };

        } catch (error) {
          console.error(
            'ERRO OPENAI - CORREÇÃO:',
            error
          );

          return {
            original: text,
            corrected: '',
            changes: [],
            error: getAIErrorMessage(
              error,
              'openai'
            ),
          };
        }
      }

      return {
        original: text,
        corrected: '',
        changes: [],
        error:
          'Anthropic ainda não está configurada no Polish.',
      };

    }
  );


  // ==========================================
  // MUDANÇA DE TONALIDADE
  // ==========================================

  ipcMain.handle(
    'change-tone',
    async (_event, text, tone, provider) => {
      const selectedProvider = normalizeProvider(provider);

      if (!text || !text.trim()) {
        return {
          original: text,
          rewritten: '',
          tone,
          error:
            'Digite um texto antes de alterar a tonalidade.',
        };
      }

      if (selectedProvider === 'gemini') {
        const gemini = getGeminiClient();

        if (!gemini) {
          return {
            original: text,
            rewritten: '',
            tone,
            error:
              'Gemini não está configurado. Adicione sua chave nas Configurações.',
          };
        }

        try {
          const response =
            await gemini.models.generateContent({
              model: 'gemini-3.5-flash-lite',

              contents: `
Reescreva o texto abaixo utilizando um tom ${tone}.

Preserve:
- o significado original;
- as informações contidas no texto;
- a intenção principal do autor.

Altere apenas a forma de escrever para adequá-la ao tom solicitado.

Não explique o que foi feito.
Responda somente com o texto reescrito.

Texto:
${text}
              `,
            });

          return {
            original: text,
            rewritten:
              response.text.trim(),
            tone,
          };

        } catch (error) {
          console.error(
            'ERRO GEMINI - TONALIDADE:',
            error
          );

          return {
            original: text,
            rewritten: '',
            tone,
            error: getAIErrorMessage(
              error,
              'gemini'
            ),
          };
        }
      }

      if (selectedProvider === 'openai') {
        const openai = getOpenAIClient();

        if (!openai) {
          return {
            original: text,
            rewritten: '',
            tone,
            error:
              'OpenAI não está configurada. Adicione sua chave nas Configurações.',
          };
        }

        try {
          const response =
            await openai.responses.create({
              model: 'gpt-5.6-luna',

              input: `
Reescreva o texto abaixo utilizando um tom ${tone}.

Preserve:
- o significado original;
- as informações contidas no texto;
- a intenção principal do autor.

Altere apenas a forma de escrever para adequá-la ao tom solicitado.

Não explique o que foi feito.
Responda somente com o texto reescrito.

Texto:
${text}
              `,
            });

          return {
            original: text,
            rewritten:
              response.output_text.trim(),
            tone,
          };

        } catch (error) {
          console.error(
            'ERRO OPENAI - TONALIDADE:',
            error
          );

          return {
            original: text,
            rewritten: '',
            tone,
            error: getAIErrorMessage(
              error,
              'openai'
            ),
          };
        }
      }

      return {
        original: text,
        rewritten: '',
        tone,
        error:
          'Anthropic ainda não está configurada no Polish.',
      };
    }
  );


  // ==========================================
  // TRADUÇÃO
  // ==========================================

  ipcMain.handle(
    'translate-text',
    async (_event, text, language, provider) => {
      const selectedProvider = normalizeProvider(provider);

      if (!text || !text.trim()) {
        return {
          original: text,
          translated: '',
          language,
          error:
            'Digite um texto antes de traduzir.',
        };
      }

      if (selectedProvider === 'gemini') {
        const gemini = getGeminiClient();

        if (!gemini) {
          return {
            original: text,
            translated: '',
            language,
            error:
              'Gemini não está configurado. Adicione sua chave nas Configurações.',
          };
        }

        try {
          const response =
            await gemini.models.generateContent({
              model: 'gemini-3.5-flash-lite',

              contents: `
Traduza o texto abaixo para ${language}.

Regras:
- preserve o significado original;
- preserve o tom e a intenção do autor;
- evite traduções excessivamente literais quando houver uma forma mais natural;
- não explique a tradução;
- responda somente com o texto traduzido.

Texto:
${text}
              `,
            });

          return {
            original: text,
            translated:
              response.text.trim(),
            language,
          };

        } catch (error) {
          console.error(
            'ERRO GEMINI - TRADUÇÃO:',
            error
          );

          return {
            original: text,
            translated: '',
            language,
            error: getAIErrorMessage(
              error,
              'gemini'
            ),
          };
        }
      }

      if (selectedProvider === 'openai') {
        const openai = getOpenAIClient();

        if (!openai) {
          return {
            original: text,
            translated: '',
            language,
            error:
              'OpenAI não está configurada. Adicione sua chave nas Configurações.',
          };
        }

        try {
          const response =
            await openai.responses.create({
              model: 'gpt-5.6-luna',

              input: `
Traduza o texto abaixo para ${language}.

Regras:
- preserve o significado original;
- preserve o tom e a intenção do autor;
- evite traduções excessivamente literais quando houver uma forma mais natural;
- não explique a tradução;
- responda somente com o texto traduzido.

Texto:
${text}
              `,
            });

          return {
            original: text,
            translated:
              response.output_text.trim(),
            language,
          };

        } catch (error) {
          console.error(
            'ERRO OPENAI - TRADUÇÃO:',
            error
          );

          return {
            original: text,
            translated: '',
            language,
            error: getAIErrorMessage(
              error,
              'openai'
            ),
          };
        }
      }

      return {
        original: text,
        translated: '',
        language,
        error:
          'Anthropic ainda não está configurada no Polish.',
      };
    }
  );


  // ==========================================
  // SALVAR NOTA
  // ==========================================

  ipcMain.handle(
    'save-note',
    async (_event, content) => {
      try {
        if (!content || !content.trim()) {
          return {
            success: false,
            error:
              'Digite algo antes de salvar a nota.',
          };
        }

        const note =
          saveNote(content.trim());

        return {
          success: true,
          note,
        };

      } catch (error) {
        console.error(
          'ERRO AO SALVAR NOTA:',
          error
        );

        return {
          success: false,
          error:
            error?.message ||
            'Não foi possível salvar a nota.',
        };
      }
    }
  );


  // ==========================================
  // BUSCAR NOTAS
  // ==========================================

  ipcMain.handle(
    'get-notes',
    async () => {
      try {
        const notes =
          getNotes();

        return {
          success: true,
          notes,
        };

      } catch (error) {
        console.error(
          'ERRO AO BUSCAR NOTAS:',
          error
        );

        return {
          success: false,
          notes: [],
          error:
            error?.message ||
            'Não foi possível carregar as notas.',
        };
      }
    }
  );


  // ==========================================
  // EXCLUIR NOTA
  // ==========================================

  ipcMain.handle(
    'delete-note',
    async (_event, id) => {
      try {
        const deleted =
          deleteNote(id);

        return {
          success: deleted,
          error: deleted
            ? undefined
            : 'Nota não encontrada.',
        };

      } catch (error) {
        console.error(
          'ERRO AO EXCLUIR NOTA:',
          error
        );

        return {
          success: false,
          error:
            error?.message ||
            'Não foi possível excluir a nota.',
        };
      }
    }
  );


  // ==========================================
  // CRIA A JANELA
  // ==========================================

  createWindow();


  // ==========================================
  // ATALHO GLOBAL
  // ==========================================

  globalShortcut.register(
    'CommandOrControl+Shift+P',
    () => {
      if (!win) {
        return;
      }

      if (win.isVisible()) {
        win.hide();
      } else {
        win.show();
        win.focus();
      }
    }
  );


  // ==========================================
  // ATIVAÇÃO DO APP
  // ==========================================

  app.on('activate', () => {
    if (!win) {
      createWindow();
    }
  });
});


// ==========================================
// ENCERRAMENTO
// ==========================================

app.on('before-quit', () => {
  app.isQuiting = true;
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});