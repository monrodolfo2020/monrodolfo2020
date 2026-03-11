// The Melodic Past — Lesson Data
// All 12 weeks of English grammar content through famous songs

export const LESSONS = [
  {
    week: 1,
    grammarTopic: "Present Simple",
    grammarES: "Presente Simple",
    descriptionES: "Acciones habituales y verdades generales.",
    song: "I'm Still Standing",
    artist: "Elton John",
    youtubeId: "ZHwVBirqD2s",
    steps: {
      listen: {
        instructions: [
          "Escucha la canción completa sin leer nada. Solo disfrútala.",
          "Escúchala por segunda vez prestando atención a los verbos.",
          "Nota cómo Elton John usa verbos como 'stand', 'look', 'feel' para hablar de su estado actual.",
          "Canta el coro en voz alta aunque no entiendas todas las palabras."
        ],
        tip: "Enfócate en el coro: 'I'm still standing, yeah, yeah, yeah'. Cada vez que escuches un verbo, señálalo con el dedo."
      },
      learn: {
        explanation: "El Presente Simple se usa para hablar de hábitos, rutinas, hechos permanentes y verdades generales. Se forma con: Sujeto + verbo base (+ s/es para he/she/it). Ejemplo: 'I stand' → 'He stands'. La forma negativa usa 'don't/doesn't' y las preguntas usan 'do/does'.",
        lyricsExamples: [
          {
            lyric: "I'm still standing better than I ever did",
            breakdown: "'Standing' describe su estado actual continuo. 'Did' es pasado de 'do' — compara el presente con el pasado."
          },
          {
            lyric: "Looking like a true survivor, feeling like a little kid",
            breakdown: "'Looking' y 'feeling' describen cómo se siente AHORA en este momento."
          },
          {
            lyric: "I'm still standing after all this time",
            breakdown: "Enfatiza que algo que comenzó en el pasado continúa en el presente."
          },
          {
            lyric: "Once I never could hope to win",
            breakdown: "'Could' es el pasado de 'can' — compara lo que era posible antes vs. ahora."
          }
        ],
        pattern: {
          title: "Cómo formar el Presente Simple",
          rules: [
            "I / You / We / They + verbo base → I stand, You look, They feel",
            "He / She / It + verbo + s/es → He stands, She looks, It feels",
            "Negativo: don't / doesn't + verbo → I don't stand, She doesn't look",
            "Pregunta: Do / Does + sujeto + verbo? → Do you stand? Does she look?"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa las oraciones con la forma correcta del verbo en paréntesis:",
            sentences: [
              { text: "Elton John ___ (sing) amazing songs.", answer: "sings", hint: "He/She/It + verbo + s" },
              { text: "I ___ (listen) to music every day.", answer: "listen", hint: "I + verbo base" },
              { text: "The chorus ___ (repeat) three times.", answer: "repeats", hint: "It + verbo + s" },
              { text: "They ___ (not/know) this song.", answer: "don't know", hint: "They + don't + verbo base" }
            ]
          },
          {
            type: "match",
            instruction: "Une cada verbo con su significado en español:",
            pairs: [
              { word: "stand", definition: "estar de pie / aguantar" },
              { word: "feel", definition: "sentir / sentirse" },
              { word: "look", definition: "parecer / mirar" },
              { word: "hope", definition: "esperar / tener esperanza" },
              { word: "survive", definition: "sobrevivir" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Lee estas frases en voz alta 3 veces cada una. Grábate si puedes:",
            prompts: [
              "I listen to music every morning.",
              "She feels happy when she sings.",
              "We don't understand every word, but we enjoy the song.",
              "Does he play guitar? Yes, he plays guitar very well."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "stand", partOfSpeech: "verbo", spanish: "estar de pie / aguantar", example: "I'm still standing after all this time.", phonetic: "/stænd/" },
      { word: "survivor", partOfSpeech: "sustantivo", spanish: "superviviente", example: "She looks like a true survivor.", phonetic: "/sərˈvaɪvər/" },
      { word: "wreck", partOfSpeech: "sustantivo", spanish: "ruina / desastre", example: "You left me as a wreck.", phonetic: "/rɛk/" },
      { word: "bitter", partOfSpeech: "adjetivo", spanish: "amargo / resentido", example: "Don't leave me bitter.", phonetic: "/ˈbɪtər/" },
      { word: "ashes", partOfSpeech: "sustantivo", spanish: "cenizas", example: "Rising from the ashes.", phonetic: "/ˈæʃɪz/" },
      { word: "true", partOfSpeech: "adjetivo", spanish: "verdadero / auténtico", example: "A true survivor.", phonetic: "/truː/" },
      { word: "win", partOfSpeech: "verbo", spanish: "ganar", example: "I never could hope to win.", phonetic: "/wɪn/" },
      { word: "once", partOfSpeech: "adverbio", spanish: "una vez / alguna vez", example: "Once I never could hope.", phonetic: "/wʌns/" }
    ]
  },
  {
    week: 2,
    grammarTopic: "Past Simple",
    grammarES: "Pasado Simple",
    descriptionES: "Eventos completados en el pasado.",
    song: "Yesterday",
    artist: "The Beatles",
    youtubeId: "NrgmdOz227I",
    steps: {
      listen: {
        instructions: [
          "Escucha 'Yesterday' dos veces sin leer. Es una de las canciones más famosas de la historia.",
          "En la tercera escucha, presta atención a los verbos en pasado: 'seemed', 'said', 'believed', 'used to be'.",
          "Nota cómo McCartney habla de algo que ya pasó — ese es el Pasado Simple.",
          "Cierra los ojos e imagina un momento de tu pasado mientras escuchas."
        ],
        tip: "La palabra 'yesterday' aparece 8 veces en la canción. Cada vez que la escuches, piensa en un recuerdo tuyo."
      },
      learn: {
        explanation: "El Pasado Simple se usa para hablar de acciones que comenzaron Y terminaron en el pasado. Los verbos regulares agregan -ed (talked, played, loved). Los irregulares cambian de forma (go→went, say→said, feel→felt). Con 'I/he/she/it', los negativos usan 'didn't' y las preguntas 'did'.",
        lyricsExamples: [
          {
            lyric: "Yesterday, all my troubles seemed so far away",
            breakdown: "'Seemed' es el pasado de 'seem' (parecer) — verbo regular con -ed. Los problemas 'parecían' lejanos, pero ya no."
          },
          {
            lyric: "I said something wrong, now I long for yesterday",
            breakdown: "'Said' es el pasado IRREGULAR de 'say'. McCartney cometió un error en el pasado y ahora lo lamenta."
          },
          {
            lyric: "I believed in yesterday",
            breakdown: "'Believed' es el pasado de 'believe' (creer) — verbo regular. Antes creía, ahora no está seguro."
          },
          {
            lyric: "Now I need a place to hide away",
            breakdown: "'Need' está en presente — compara el ayer (pasado) con el hoy (presente)."
          }
        ],
        pattern: {
          title: "Cómo formar el Pasado Simple",
          rules: [
            "Verbos regulares: verbo + -ed → talked, played, lived, believed",
            "Verbos irregulares: cambian de forma → go→went, say→said, feel→felt, know→knew",
            "Negativo: didn't + verbo base → I didn't say, She didn't know",
            "Pregunta: Did + sujeto + verbo base? → Did you say? Did she know?"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con el pasado correcto del verbo:",
            sentences: [
              { text: "Yesterday I ___ (feel) very happy.", answer: "felt", hint: "feel → felt (irregular)" },
              { text: "She ___ (believe) in him completely.", answer: "believed", hint: "believe + d (regular)" },
              { text: "They ___ (not/know) the answer.", answer: "didn't know", hint: "didn't + verbo base" },
              { text: "___ you (say) something wrong?", answer: "Did you say", hint: "Did + sujeto + verbo base" }
            ]
          },
          {
            type: "match",
            instruction: "Une el verbo presente con su forma en pasado:",
            pairs: [
              { word: "go", definition: "went" },
              { word: "say", definition: "said" },
              { word: "feel", definition: "felt" },
              { word: "know", definition: "knew" },
              { word: "believe", definition: "believed" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Habla en voz alta sobre tu ayer. Usa estas frases como guía:",
            prompts: [
              "Yesterday I woke up at ___ o'clock.",
              "I ate ___ for breakfast.",
              "I talked to ___ on the phone.",
              "I felt ___ because ___."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "trouble", partOfSpeech: "sustantivo", spanish: "problema / dificultad", example: "All my troubles seemed so far away.", phonetic: "/ˈtrʌbəl/" },
      { word: "seem", partOfSpeech: "verbo", spanish: "parecer", example: "It seemed like a good idea.", phonetic: "/siːm/" },
      { word: "suddenly", partOfSpeech: "adverbio", spanish: "de repente / súbitamente", example: "Suddenly, I'm not half the man I used to be.", phonetic: "/ˈsʌdənli/" },
      { word: "shadow", partOfSpeech: "sustantivo", spanish: "sombra", example: "There's a shadow hanging over me.", phonetic: "/ˈʃædoʊ/" },
      { word: "believe", partOfSpeech: "verbo", spanish: "creer", example: "I believed in yesterday.", phonetic: "/bɪˈliːv/" },
      { word: "hide", partOfSpeech: "verbo", spanish: "esconderse / ocultarse", example: "I need a place to hide away.", phonetic: "/haɪd/" },
      { word: "long for", partOfSpeech: "frase verbal", spanish: "anhelar / extrañar", example: "Now I long for yesterday.", phonetic: "/lɒŋ fɔːr/" },
      { word: "half", partOfSpeech: "adjetivo/sustantivo", spanish: "la mitad", example: "I'm not half the man I used to be.", phonetic: "/hæf/" }
    ]
  },
  {
    week: 3,
    grammarTopic: "Present Continuous",
    grammarES: "Presente Continuo",
    descriptionES: "Acciones que están pasando ahora mismo.",
    song: "Shape of You",
    artist: "Ed Sheeran",
    youtubeId: "JGwWNGJdvx8",
    steps: {
      listen: {
        instructions: [
          "Escucha 'Shape of You' y nota el ritmo pegajoso — es perfecto para aprender.",
          "Identifica frases como 'I'm in love', 'We're talking'.",
          "Presta atención a las acciones que están ocurriendo MIENTRAS la historia se desarrolla.",
          "Canta el coro completo: 'I'm in love with the shape of you'."
        ],
        tip: "El Presente Continuo describe lo que está pasando AHORA. Busca palabras terminadas en -ing."
      },
      learn: {
        explanation: "El Presente Continuo se usa para acciones que están ocurriendo en este momento o que son temporales. Se forma con: am/is/are + verbo-ing. 'I am eating' (estoy comiendo ahora). También se usa para planes futuros confirmados: 'I'm meeting her tomorrow'.",
        lyricsExamples: [
          {
            lyric: "We're talking every day",
            breakdown: "'We're talking' = We are talking. La acción de hablar está en progreso, es habitual en esta etapa de la relación."
          },
          {
            lyric: "I'm in love with the shape of you",
            breakdown: "'I'm in love' = I am in love. Estado actual, sentimiento que existe AHORA."
          },
          {
            lyric: "We push and pull like a magnet do",
            breakdown: "Aquí usa Presente Simple para describir una verdad general/permanente — contrasta con el Continuo."
          }
        ],
        pattern: {
          title: "Cómo formar el Presente Continuo",
          rules: [
            "am/is/are + verbo + -ing",
            "I am working, You are listening, She is singing",
            "Negativo: am/is/are + not + verbo-ing → I'm not working",
            "Pregunta: Am/Is/Are + sujeto + verbo-ing? → Are you working?"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con la forma correcta del Presente Continuo:",
            sentences: [
              { text: "Ed Sheeran ___ (sing) right now.", answer: "is singing", hint: "is + verbo-ing" },
              { text: "We ___ (learn) English with songs.", answer: "are learning", hint: "are + verbo-ing" },
              { text: "She ___ (not/talk) to me today.", answer: "isn't talking", hint: "isn't + verbo-ing" },
              { text: "___ you ___ (enjoy) this lesson?", answer: "Are / enjoying", hint: "Are + sujeto + verbo-ing?" }
            ]
          },
          {
            type: "match",
            instruction: "Une cada verbo con su forma -ing:",
            pairs: [
              { word: "run", definition: "running (doble consonante)" },
              { word: "make", definition: "making (quitar e)" },
              { word: "talk", definition: "talking (+ ing normal)" },
              { word: "sit", definition: "sitting (doble consonante)" },
              { word: "love", definition: "loving (quitar e)" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Describe lo que estás haciendo AHORA MISMO en inglés:",
            prompts: [
              "I am sitting in ___.",
              "I am learning English with ___.",
              "I am listening to ___ right now.",
              "My phone is ___ (lying/charging/ringing)."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "shape", partOfSpeech: "sustantivo", spanish: "forma / figura", example: "I'm in love with the shape of you.", phonetic: "/ʃeɪp/" },
      { word: "grab", partOfSpeech: "verbo", spanish: "agarrar / tomar", example: "I grab a coffee and we talk.", phonetic: "/ɡræb/" },
      { word: "discover", partOfSpeech: "verbo", spanish: "descubrir", example: "We discover the same taste.", phonetic: "/dɪˈskʌvər/" },
      { word: "magnet", partOfSpeech: "sustantivo", spanish: "imán", example: "We push and pull like a magnet.", phonetic: "/ˈmæɡnɪt/" },
      { word: "every day", partOfSpeech: "adverbio", spanish: "todos los días", example: "We're talking every day.", phonetic: "/ˈɛvri deɪ/" },
      { word: "taste", partOfSpeech: "sustantivo", spanish: "gusto / sabor", example: "We discover the same taste.", phonetic: "/teɪst/" },
      { word: "bar", partOfSpeech: "sustantivo", spanish: "bar / tableta", example: "I met you in a bar.", phonetic: "/bɑːr/" },
      { word: "push and pull", partOfSpeech: "frase verbal", spanish: "empujar y jalar / vaivén", example: "We push and pull like magnets do.", phonetic: "/pʊʃ ænd pʊl/" }
    ]
  },
  {
    week: 4,
    grammarTopic: "Past Continuous",
    grammarES: "Pasado Continuo",
    descriptionES: "Acciones en progreso en un momento del pasado.",
    song: "Hotel California",
    artist: "Eagles",
    youtubeId: "BciS5krYL80",
    steps: {
      listen: {
        instructions: [
          "Escucha 'Hotel California' y visualiza la escena: alguien llegando a un hotel misterioso.",
          "Nota las descripciones de lo que estaba ocurriendo cuando llegó: 'She was standing there'.",
          "El Pasado Continuo pinta el escenario de fondo de una historia.",
          "Identifica qué estaba pasando (continuo) y qué ocurrió de repente (simple)."
        ],
        tip: "Imagina una película: el Pasado Continuo es el paisaje de fondo, el Pasado Simple son los eventos que interrumpen."
      },
      learn: {
        explanation: "El Pasado Continuo describe una acción que estaba EN PROGRESO en un momento específico del pasado. Se forma con: was/were + verbo-ing. Frecuentemente se combina con el Pasado Simple: 'I was sleeping when the phone rang' — la acción continua (sleeping) fue interrumpida por el evento (rang).",
        lyricsExamples: [
          {
            lyric: "Her mind is Tiffany-twisted, she got the Mercedes bends",
            breakdown: "Descripción del personaje usando presente — el narrador recuerda y describe."
          },
          {
            lyric: "On a dark desert highway, cool wind in my hair",
            breakdown: "El escenario de fondo: EL viento ESTABA soplando mientras viajaba — contexto continuo."
          },
          {
            lyric: "I was thinking to myself, 'This could be Heaven or this could be Hell'",
            breakdown: "'Was thinking' = Pasado Continuo. Acción mental en progreso en ese momento del pasado."
          }
        ],
        pattern: {
          title: "Cómo formar el Pasado Continuo",
          rules: [
            "was/were + verbo + -ing",
            "I/He/She/It + was + verbo-ing → I was thinking",
            "You/We/They + were + verbo-ing → They were singing",
            "Combinado: was/were -ing + when + Past Simple → I was sleeping when the alarm rang"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con Pasado Continuo o Pasado Simple:",
            sentences: [
              { text: "I ___ (drive) when I ___ (see) the hotel.", answer: "was driving / saw", hint: "was/were + -ing para continuo; simple para el evento" },
              { text: "She ___ (stand) in the doorway.", answer: "was standing", hint: "was + verbo-ing" },
              { text: "They ___ (dance) all night.", answer: "were dancing", hint: "were + verbo-ing" },
              { text: "What ___ you ___ (think) at that moment?", answer: "were / thinking", hint: "Were + sujeto + verbo-ing?" }
            ]
          },
          {
            type: "match",
            instruction: "Une la acción continua con el evento que la interrumpió:",
            pairs: [
              { word: "I was sleeping...", definition: "...when the phone rang." },
              { word: "She was cooking...", definition: "...when the fire started." },
              { word: "They were driving...", definition: "...when it began to rain." },
              { word: "He was reading...", definition: "...when the lights went out." }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Cuéntale a alguien qué estabas haciendo ayer a estas horas:",
            prompts: [
              "At 8 AM yesterday, I was ___.",
              "While I was ___, my phone ___.",
              "Last night at 10 PM, I was ___.",
              "I was ___ when I heard the news about ___."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "highway", partOfSpeech: "sustantivo", spanish: "autopista / carretera", example: "On a dark desert highway.", phonetic: "/ˈhaɪweɪ/" },
      { word: "desert", partOfSpeech: "adjetivo/sustantivo", spanish: "desierto / desértico", example: "A dark desert highway.", phonetic: "/ˈdɛzərt/" },
      { word: "shimmering", partOfSpeech: "adjetivo", spanish: "resplandeciente / titilante", example: "Shimmering light.", phonetic: "/ˈʃɪmərɪŋ/" },
      { word: "mission", partOfSpeech: "sustantivo", spanish: "misión / capilla", example: "Her mind is Tiffany-twisted.", phonetic: "/ˈmɪʃən/" },
      { word: "courtyard", partOfSpeech: "sustantivo", spanish: "patio interior", example: "Voices in the courtyard.", phonetic: "/ˈkɔːrtjɑːrd/" },
      { word: "check out", partOfSpeech: "frase verbal", spanish: "hacer el check-out / salir", example: "You can check out any time.", phonetic: "/tʃɛk aʊt/" },
      { word: "leave", partOfSpeech: "verbo", spanish: "irse / dejar", example: "But you can never leave.", phonetic: "/liːv/" },
      { word: "heaven", partOfSpeech: "sustantivo", spanish: "cielo / paraíso", example: "This could be Heaven.", phonetic: "/ˈhɛvən/" }
    ]
  },
  {
    week: 5,
    grammarTopic: "Future Simple (will)",
    grammarES: "Futuro Simple con 'will'",
    descriptionES: "Decisiones espontáneas y predicciones sobre el futuro.",
    song: "Don't Stop Me Now",
    artist: "Queen",
    youtubeId: "HgzGwKwLmgM",
    steps: {
      listen: {
        instructions: [
          "¡Esta canción es pura energía! Escúchala y déjate llevar.",
          "Freddie Mercury habla de lo que VA a hacer — futuro de planes y determinación.",
          "Identifica 'I'm gonna' (informal de 'I'm going to') y 'I will'.",
          "Canta la parte más energética: 'Don't stop me now, I'm having such a good time!'"
        ],
        tip: "'Will' expresa decisiones espontáneas y promesas. 'Going to' expresa planes ya decididos. ¡Ambas son correctas!"
      },
      learn: {
        explanation: "El Futuro con 'will' se usa para: promesas ('I will help you'), decisiones espontáneas ('I'll take that one'), predicciones ('It will rain tomorrow') y hechos futuros. Se forma con: will + verbo base (sin cambios para todos los sujetos). La contracción es 'll (I'll, she'll, they'll).",
        lyricsExamples: [
          {
            lyric: "Tonight I'm gonna have myself a real good time",
            breakdown: "'I'm gonna' = I am going to — plan ya decidido para esta noche. ¡Freddie ya sabe lo que quiere!"
          },
          {
            lyric: "I feel alive and the world, I'll turn it inside out",
            breakdown: "'I'll turn' = I will turn. Decisión/promesa espontánea — expresión de su energía del momento."
          },
          {
            lyric: "Don't stop me now, 'cause I'm having a good time",
            breakdown: "Ruega que nadie interfiera con sus planes — combina presente continuo + futuro implícito."
          }
        ],
        pattern: {
          title: "Cómo usar 'will' para el futuro",
          rules: [
            "will + verbo base (igual para todos): I will go, She will sing, They will come",
            "Contracción: I'll, you'll, he'll, she'll, we'll, they'll",
            "Negativo: won't (will not) + verbo → I won't stop",
            "Pregunta: Will + sujeto + verbo? → Will you come? Will she sing?"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con will / won't:",
            sentences: [
              { text: "I ___ never stop dancing!", answer: "will", hint: "Afirmativo: will + verbo" },
              { text: "She ___ (not) give up on her dreams.", answer: "won't", hint: "Negativo: won't = will not" },
              { text: "___ you help me practice English?", answer: "Will", hint: "Pregunta: Will + sujeto" },
              { text: "They ___ arrive at midnight.", answer: "will", hint: "will + verbo base" }
            ]
          },
          {
            type: "match",
            instruction: "Une el uso de 'will' con su función:",
            pairs: [
              { word: "'I'll call you later'", definition: "Promesa espontánea" },
              { word: "'It will rain tomorrow'", definition: "Predicción" },
              { word: "'I'll have the pizza'", definition: "Decisión en el momento" },
              { word: "'She will be 30 next year'", definition: "Hecho futuro" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Haz promesas y predicciones en voz alta:",
            prompts: [
              "I will study English every day this week.",
              "I won't give up even when it's difficult.",
              "I think technology will change education.",
              "Will you practice English with me? Yes, I will!"
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "explode", partOfSpeech: "verbo", spanish: "explotar / estallar", example: "I'm gonna make a supersonic man out of you.", phonetic: "/ɪkˈsploʊd/" },
      { word: "supersonic", partOfSpeech: "adjetivo", spanish: "supersónico / muy rápido", example: "I'm a supersonic rocket ship.", phonetic: "/ˌsuːpərˈsɒnɪk/" },
      { word: "gonna", partOfSpeech: "contracción informal", spanish: "voy a (going to)", example: "I'm gonna have a good time.", phonetic: "/ˈɡɒnə/" },
      { word: "float", partOfSpeech: "verbo", spanish: "flotar", example: "I'm floating around in ecstasy.", phonetic: "/floʊt/" },
      { word: "ecstasy", partOfSpeech: "sustantivo", spanish: "éxtasis / alegría inmensa", example: "Floating around in ecstasy.", phonetic: "/ˈɛkstəsi/" },
      { word: "race", partOfSpeech: "verbo/sustantivo", spanish: "correr / carrera", example: "Like a racing car.", phonetic: "/reɪs/" },
      { word: "burning", partOfSpeech: "adjetivo", spanish: "ardiendo / encendido", example: "Burning through the sky.", phonetic: "/ˈbɜːrnɪŋ/" },
      { word: "fuse", partOfSpeech: "sustantivo", spanish: "mecha / fusible", example: "Two hundred degrees, that's why they call me Mister Fahrenheit.", phonetic: "/fjuːz/" }
    ]
  },
  {
    week: 6,
    grammarTopic: "Present Perfect",
    grammarES: "Presente Perfecto",
    descriptionES: "Experiencias pasadas con relevancia en el presente.",
    song: "We Are the Champions",
    artist: "Queen",
    youtubeId: "04854XqcfBg",
    steps: {
      listen: {
        instructions: [
          "Escucha este himno de victoria de Queen. ¡Es uno de los más famosos de la historia!",
          "Freddie Mercury habla de logros que ha alcanzado — conecta el pasado con el presente.",
          "Busca 'I've paid', 'I've done', 'I've had' — todas usan el Presente Perfecto.",
          "Canta con toda tu energía: 'We are the champions, my friends!'"
        ],
        tip: "El Presente Perfecto conecta el pasado con el presente. 'I have won' significa que gané antes Y eso importa ahora."
      },
      learn: {
        explanation: "El Presente Perfecto conecta una experiencia o acción pasada con el presente. Se forma con: have/has + participio pasado. Se usa para: experiencias de vida ('I've visited Paris'), acciones recientes con resultado presente ('I've lost my keys'), y acciones que empezaron en el pasado y continúan ('I've lived here for 5 years').",
        lyricsExamples: [
          {
            lyric: "I've paid my dues, time after time",
            breakdown: "'I've paid' = I have paid. Las deudas fueron pagadas en el pasado, y eso define quién es ahora."
          },
          {
            lyric: "I've done my sentence but committed no crime",
            breakdown: "'I've done' = I have done. Cumplió algo difícil (relevante para el presente)."
          },
          {
            lyric: "I've had my share of sand kicked in my face",
            breakdown: "'I've had' = I have had. Experiencia de vida que lo ha formado."
          }
        ],
        pattern: {
          title: "Cómo formar el Presente Perfecto",
          rules: [
            "have/has + participio pasado",
            "I/You/We/They + have → I have won, They have tried",
            "He/She/It + has → She has won, He has tried",
            "Contracciones: I've, you've, he's, she's, we've, they've",
            "Palabras clave: already, yet, just, ever, never, for, since"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con el Presente Perfecto:",
            sentences: [
              { text: "I ___ (win) the championship!", answer: "have won", hint: "have + participio pasado" },
              { text: "She ___ (never/give up) on her dreams.", answer: "has never given up", hint: "has + never + participio" },
              { text "___ you ever ___ (visit) London?", answer: "Have / visited", hint: "Have + sujeto + participio?" },
              { text: "They ___ (just/finish) the concert.", answer: "have just finished", hint: "have + just + participio" }
            ]
          },
          {
            type: "match",
            instruction: "Une el verbo con su participio pasado irregular:",
            pairs: [
              { word: "win", definition: "won" },
              { word: "pay", definition: "paid" },
              { word: "do", definition: "done" },
              { word: "have", definition: "had" },
              { word: "make", definition: "made" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Habla sobre tus experiencias de vida:",
            prompts: [
              "I have never ___ (eaten sushi / visited another country / spoken English with a native).",
              "I have always ___ (loved music / wanted to learn English).",
              "Have you ever won something? Yes, I have won ___.",
              "I've just learned about the Present Perfect!"
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "champion", partOfSpeech: "sustantivo", spanish: "campeón", example: "We are the champions.", phonetic: "/ˈtʃæmpiən/" },
      { word: "dues", partOfSpeech: "sustantivo plural", spanish: "deudas / cuotas / tributo merecido", example: "I've paid my dues.", phonetic: "/djuːz/" },
      { word: "sentence", partOfSpeech: "sustantivo", spanish: "condena / oración", example: "I've done my sentence.", phonetic: "/ˈsɛntəns/" },
      { word: "commit", partOfSpeech: "verbo", spanish: "cometer", example: "I committed no crime.", phonetic: "/kəˈmɪt/" },
      { word: "curtain call", partOfSpeech: "sustantivo", spanish: "saludo final / telón", example: "No time for losers — curtain call.", phonetic: "/ˈkɜːrtən kɔːl/" },
      { word: "glory", partOfSpeech: "sustantivo", spanish: "gloria / esplendor", example: "We'll keep on fighting till the end.", phonetic: "/ˈɡlɔːri/" },
      { word: "loser", partOfSpeech: "sustantivo", spanish: "perdedor", example: "No time for losers.", phonetic: "/ˈluːzər/" },
      { word: "keep on", partOfSpeech: "frase verbal", spanish: "seguir / continuar haciendo", example: "We'll keep on fighting.", phonetic: "/kiːp ɒn/" }
    ]
  },
  {
    week: 7,
    grammarTopic: "Comparatives & Superlatives",
    grammarES: "Comparativos y Superlativos",
    descriptionES: "Comparar personas, cosas e ideas.",
    song: "Beautiful",
    artist: "Christina Aguilera",
    youtubeId: "eAfyFua6YFI",
    steps: {
      listen: {
        instructions: [
          "Escucha 'Beautiful' de Christina Aguilera — un mensaje de amor propio.",
          "Presta atención a adjetivos: 'beautiful', 'stronger', 'better'.",
          "Los comparativos (-er / more) y superlativos (-est / most) aparecen en esta canción.",
          "Reflexiona: ¿Qué te hace sentir hermoso/a?"
        ],
        tip: "Adjetivos cortos (1 sílaba): beautiful→ más bello (se usa more). Adjetivos cortos (tall, strong): taller, stronger."
      },
      learn: {
        explanation: "Los Comparativos se usan para comparar dos cosas: 'She is taller than me'. Los Superlativos indican el extremo máximo: 'She is the tallest'. Adjetivos cortos (1 sílaba): añadir -er/-est. Adjetivos largos (2+ sílabas): usar more/most. Irregulares: good→better→best, bad→worse→worst.",
        lyricsExamples: [
          {
            lyric: "You are beautiful, no matter what they say",
            breakdown: "Usa el adjetivo en grado normal. El mensaje es que la belleza no necesita comparación."
          },
          {
            lyric: "Words can't bring me down",
            breakdown: "Implica que ella ES más fuerte que las palabras — comparativo implícito de fortaleza."
          },
          {
            lyric: "I am beautiful in every single way",
            breakdown: "Afirmación de belleza sin comparación — belleza como valor absoluto, no relativo."
          }
        ],
        pattern: {
          title: "Comparativos y Superlativos",
          rules: [
            "Adjetivos cortos: tall → taller (than) → the tallest",
            "Adjetivos largos: beautiful → more beautiful (than) → the most beautiful",
            "Irregulares: good → better → best | bad → worse → worst",
            "Igual: as + adjetivo + as → She is as beautiful as the stars"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con el comparativo o superlativo:",
            sentences: [
              { text: "She is ___ (beautiful) than ever.", answer: "more beautiful", hint: "Adjetivo largo: more + adj" },
              { text: "You are the ___ (strong) person I know.", answer: "strongest", hint: "Adjetivo corto: the + adj + est" },
              { text: "Today is ___ (good) than yesterday.", answer: "better", hint: "Irregular: good → better" },
              { text: "This is the ___ (bad) day ever.", answer: "worst", hint: "Irregular: bad → worst" }
            ]
          },
          {
            type: "match",
            instruction: "Une el adjetivo con su comparativo y superlativo:",
            pairs: [
              { word: "good", definition: "better / the best" },
              { word: "bad", definition: "worse / the worst" },
              { word: "far", definition: "farther / the farthest" },
              { word: "happy", definition: "happier / the happiest" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Compara cosas de tu vida diaria:",
            prompts: [
              "English is more ___ than I thought.",
              "Music makes me feel better than ___.",
              "The best song I've ever heard is ___.",
              "I am stronger now than I was ___."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "beautiful", partOfSpeech: "adjetivo", spanish: "hermoso/a / bello/a", example: "You are beautiful no matter what they say.", phonetic: "/ˈbjuːtɪfəl/" },
      { word: "matter", partOfSpeech: "verbo", spanish: "importar", example: "No matter what they say.", phonetic: "/ˈmætər/" },
      { word: "bring down", partOfSpeech: "frase verbal", spanish: "deprimir / derribar", example: "Words can't bring me down.", phonetic: "/brɪŋ daʊn/" },
      { word: "worthless", partOfSpeech: "adjetivo", spanish: "sin valor / inútil", example: "They think they're worthless.", phonetic: "/ˈwɜːrθlɪs/" },
      { word: "remind", partOfSpeech: "verbo", spanish: "recordar a alguien", example: "I need you to remind me.", phonetic: "/rɪˈmaɪnd/" },
      { word: "every single", partOfSpeech: "expresión", spanish: "absolutamente cada", example: "Beautiful in every single way.", phonetic: "/ˈɛvri ˈsɪŋɡəl/" },
      { word: "soul", partOfSpeech: "sustantivo", spanish: "alma", example: "My soul and my mind.", phonetic: "/soʊl/" },
      { word: "no matter what", partOfSpeech: "expresión", spanish: "sin importar qué", example: "No matter what they say.", phonetic: "/noʊ ˈmætər wɒt/" }
    ]
  },
  {
    week: 8,
    grammarTopic: "Modal Verbs",
    grammarES: "Verbos Modales",
    descriptionES: "Expresar posibilidad, habilidad, permiso y obligación.",
    song: "Can't Help Falling in Love",
    artist: "Elvis Presley",
    youtubeId: "vGJTaP6anOU",
    steps: {
      listen: {
        instructions: [
          "Escucha la voz suave y profunda de Elvis. Esta canción es perfecta para el romanticismo.",
          "Nota el verbo modal 'can' en el título: 'Can't Help' = No puedo evitar.",
          "Los verbos modales como 'can', 'shall', 'would' aparecen varias veces.",
          "Canta suavemente con Elvis: 'Take my hand, take my whole life too'."
        ],
        tip: "'Can't help doing something' significa que es imposible evitar hacerlo. ¡Muy útil en inglés cotidiano!"
      },
      learn: {
        explanation: "Los Verbos Modales (can, could, will, would, shall, should, may, might, must) se usan para expresar: capacidad (can), posibilidad (may/might), permiso (can/may), obligación (must/should), y deseos/peticiones (would). NUNCA se conjugan y siempre van seguidos del verbo base.",
        lyricsExamples: [
          {
            lyric: "Wise men say only fools rush in, but I can't help falling in love with you",
            breakdown: "'Can't' = cannot. Expresa incapacidad — es imposible para él evitar enamorarse. Modal de capacidad/posibilidad."
          },
          {
            lyric: "Shall I stay? Would it be a sin?",
            breakdown: "'Shall' = used for formal offers/suggestions. 'Would it be' = pregunta condicional educada."
          },
          {
            lyric: "Take my hand, take my whole life too",
            breakdown: "Petición directa — imperativo. Después de modales como 'would you take my hand?' sería más educado."
          }
        ],
        pattern: {
          title: "Verbos Modales principales",
          rules: [
            "can / can't → capacidad: I can sing. She can't dance.",
            "should / shouldn't → consejo: You should practice every day.",
            "must / mustn't → obligación: You must listen to the music.",
            "would → petición educada: Would you help me?",
            "may / might → posibilidad: It may rain. She might come."
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa con el modal correcto (can, should, must, would, may):",
            sentences: [
              { text: "I ___ help falling in love with music.", answer: "can't", hint: "can't = no puedo evitar" },
              { text: "You ___ practice English every day to improve.", answer: "should", hint: "should = consejo" },
              { text: "___ you pass me the lyrics, please?", answer: "Would / Could", hint: "Petición educada" },
              { text: "I ___ visit Elvis's home someday — I'm not sure.", answer: "might / may", hint: "Posibilidad incierta" }
            ]
          },
          {
            type: "match",
            instruction: "Une cada modal con su función:",
            pairs: [
              { word: "can", definition: "Capacidad / habilidad" },
              { word: "should", definition: "Consejo o recomendación" },
              { word: "must", definition: "Obligación fuerte" },
              { word: "might", definition: "Posibilidad baja" },
              { word: "would", definition: "Petición educada / condicional" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Usa verbos modales para hablar de ti mismo:",
            prompts: [
              "I can ___ (skill you have).",
              "I can't ___ yet, but I'm learning.",
              "I should ___ more often.",
              "Would you ___ with me? (ask someone for something politely)"
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "wise", partOfSpeech: "adjetivo", spanish: "sabio / prudente", example: "Wise men say only fools rush in.", phonetic: "/waɪz/" },
      { word: "fool", partOfSpeech: "sustantivo", spanish: "tonto / necio", example: "Only fools rush in.", phonetic: "/fuːl/" },
      { word: "rush in", partOfSpeech: "frase verbal", spanish: "precipitarse / entrar corriendo", example: "Only fools rush in.", phonetic: "/rʌʃ ɪn/" },
      { word: "sin", partOfSpeech: "sustantivo", spanish: "pecado", example: "Would it be a sin?", phonetic: "/sɪn/" },
      { word: "darling", partOfSpeech: "sustantivo", spanish: "querido/a / cariño", example: "Take my hand, my darling.", phonetic: "/ˈdɑːrlɪŋ/" },
      { word: "whole", partOfSpeech: "adjetivo", spanish: "entero / todo", example: "Take my whole life too.", phonetic: "/hoʊl/" },
      { word: "can't help", partOfSpeech: "expresión", spanish: "no poder evitar", example: "I can't help falling in love.", phonetic: "/kænt hɛlp/" },
      { word: "falling in love", partOfSpeech: "frase verbal", spanish: "enamorarse", example: "Falling in love with you.", phonetic: "/ˈfɔːlɪŋ ɪn lʌv/" }
    ]
  },
  {
    week: 9,
    grammarTopic: "First Conditional",
    grammarES: "Primera Condicional",
    descriptionES: "Situaciones posibles y sus consecuencias reales.",
    song: "If I Were a Boy",
    artist: "Beyoncé",
    youtubeId: "AWpsOqh8q0M",
    steps: {
      listen: {
        instructions: [
          "Escucha 'If I Were a Boy' — Beyoncé imagina cómo sería la vida si fuera un hombre.",
          "Nota el uso constante de 'if' — introduce condiciones hipotéticas.",
          "Aunque el título usa la Segunda Condicional (were), el contenido tiene Primera Condicional.",
          "Reflexiona: ¿Qué harías 'if' tuvieras más tiempo para aprender inglés?"
        ],
        tip: "La Primera Condicional describe situaciones POSIBLES: 'If it rains, I will stay home.' Las dos partes se conectan con 'if' y 'will/won't'."
      },
      learn: {
        explanation: "La Primera Condicional habla de situaciones reales y posibles en el futuro. Estructura: If + Presente Simple, will + verbo base. Ejemplo: 'If you study, you will improve.' La parte con 'if' puede ir primero o segundo. Si va primero, se pone una coma. La Segunda Condicional (more advanced) usa 'were/was' para hipótesis irreales.",
        lyricsExamples: [
          {
            lyric: "If I were a boy, I think I could understand",
            breakdown: "Esto es Segunda Condicional (hipotética irreal) — Beyoncé NO es un chico. 'Were' + 'could' para situaciones imaginarias."
          },
          {
            lyric: "If you thought I would wait for you",
            breakdown: "Condicional con pasado — expresa una condición que resultó falsa. 'Thought' (pasado de think)."
          }
        ],
        pattern: {
          title: "Primera Condicional — Situaciones Posibles",
          rules: [
            "If + Presente Simple, will + verbo base",
            "If it rains, I will stay home.",
            "I will stay home if it rains. (misma frase, diferente orden)",
            "If you practice every day, your English will improve fast.",
            "Negativo: If you don't practice, you won't improve."
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Completa las oraciones con la Primera Condicional:",
            sentences: [
              { text: "If you ___ (listen) to music in English, you ___ (learn) faster.", answer: "listen / will learn", hint: "If + presente, will + verbo base" },
              { text: "If I ___ (not/practice), I ___ (not/improve).", answer: "don't practice / won't improve", hint: "If + don't + verbo, won't + verbo" },
              { text: "___ you help me if I ___ (need) it?", answer: "Will / need", hint: "Will + sujeto + verbo? if + presente" },
              { text: "If she ___ (study) hard, she ___ (pass) the exam.", answer: "studies / will pass", hint: "If + he/she + verbo+s, will + verbo" }
            ]
          },
          {
            type: "match",
            instruction: "Une la condición con su consecuencia lógica:",
            pairs: [
              { word: "If you eat too much...", definition: "...you will feel sick." },
              { word: "If I win the lottery...", definition: "...I will travel the world." },
              { word: "If it doesn't rain...", definition: "...we will have a picnic." },
              { word: "If you don't sleep enough...", definition: "...you will be tired." }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Crea tus propias oraciones condicionales:",
            prompts: [
              "If I learn English well, I will ___.",
              "If I have free time this weekend, I will ___.",
              "I won't ___ if I don't ___.",
              "If you listen to songs in English every day, your vocabulary will ___."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "understand", partOfSpeech: "verbo", spanish: "entender / comprender", example: "I think I could understand.", phonetic: "/ˌʌndərˈstænd/" },
      { word: "put yourself in", partOfSpeech: "expresión", spanish: "ponerse en el lugar de", example: "I'd put myself in your shoes.", phonetic: "/" },
      { word: "chase", partOfSpeech: "verbo", spanish: "perseguir / correr detrás", example: "I'd chase after the guys.", phonetic: "/tʃeɪs/" },
      { word: "flirt", partOfSpeech: "verbo", spanish: "coquetear / flirtear", example: "I'd flirt with the girls.", phonetic: "/flɜːrt/" },
      { word: "regret", partOfSpeech: "verbo/sustantivo", spanish: "arrepentirse / arrepentimiento", example: "Would you regret it?", phonetic: "/rɪˈɡrɛt/" },
      { word: "wait", partOfSpeech: "verbo", spanish: "esperar", example: "Did you think I would wait for you?", phonetic: "/weɪt/" },
      { word: "faithful", partOfSpeech: "adjetivo", spanish: "fiel / leal", example: "Stay faithful to someone.", phonetic: "/ˈfeɪθfəl/" },
      { word: "instead", partOfSpeech: "adverbio", spanish: "en cambio / en vez de eso", example: "I'd listen to her instead.", phonetic: "/ɪnˈstɛd/" }
    ]
  },
  {
    week: 10,
    grammarTopic: "Phrasal Verbs",
    grammarES: "Verbos Frasales",
    descriptionES: "Verbos combinados con preposiciones que cambian su significado.",
    song: "Wake Me Up",
    artist: "Avicii",
    youtubeId: "IcrbM1l_BoI",
    steps: {
      listen: {
        instructions: [
          "Escucha 'Wake Me Up' — tiene un mix increíble de folk y electrónica.",
          "Busca los phrasal verbs: 'wake up', 'grow up', 'find out', 'carry on'.",
          "Los phrasal verbs son combinaciones de verbo + partícula que crean un nuevo significado.",
          "Intenta cantar el coro completo prestando atención a cada phrasal verb."
        ],
        tip: "'Wake up' no solo significa despertar físicamente — también puede significar darse cuenta de algo. El contexto lo dice todo."
      },
      learn: {
        explanation: "Los Phrasal Verbs son combinaciones de un verbo + preposición/adverbio (partícula) que tienen un significado diferente al verbo solo. 'Give up' ≠ give + up por separado — significa 'rendirse'. Son muy comunes en inglés hablado e informal. Algunos son separables (put it on) y otros no (look after someone).",
        lyricsExamples: [
          {
            lyric: "Wake me up when it's all over",
            breakdown: "'Wake up' = despertarse. Pero aquí también implica 'alertarme' cuando la situación termine."
          },
          {
            lyric: "I tried carrying the weight of the world",
            breakdown: "'Carry on/carry' — aquí sin partícula. 'Carry on' = continuar. Nota la diferencia."
          },
          {
            lyric: "All this time I was finding myself",
            breakdown: "'Find out' = descubrir/enterarse. 'Find myself' = descubrirse a sí mismo. ¡Significados diferentes!"
          }
        ],
        pattern: {
          title: "Phrasal Verbs más comunes",
          rules: [
            "wake up = despertar(se)",
            "give up = rendirse / abandonar",
            "grow up = crecer / madurar",
            "find out = descubrir / enterarse",
            "carry on = continuar / seguir adelante",
            "look after = cuidar de alguien",
            "turn up = aparecer / subir volumen",
            "run out of = quedarse sin"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Reemplaza la frase en español con el phrasal verb correcto:",
            sentences: [
              { text: "Don't ___ (rendirse) — keep learning English!", answer: "give up", hint: "give up = rendirse" },
              { text: "I need to ___ (descubrir) the answer.", answer: "find out", hint: "find out = descubrir" },
              { text: "Please ___ (cuidar) my dog this weekend.", answer: "look after", hint: "look after = cuidar" },
              { text: "We ___ (nos quedamos sin) milk this morning.", answer: "ran out of", hint: "run out of = quedarse sin" }
            ]
          },
          {
            type: "match",
            instruction: "Une el phrasal verb con su significado:",
            pairs: [
              { word: "wake up", definition: "despertar / darse cuenta" },
              { word: "grow up", definition: "crecer / madurar" },
              { word: "carry on", definition: "continuar / seguir" },
              { word: "turn up", definition: "aparecer inesperadamente / subir volumen" },
              { word: "give up", definition: "rendirse / abandonar" }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Usa phrasal verbs para hablar de tu día:",
            prompts: [
              "I wake up at ___ every morning.",
              "I never give up on ___.",
              "I found out that ___ yesterday.",
              "I ran out of ___ last week."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "wiser", partOfSpeech: "adjetivo comparativo", spanish: "más sabio", example: "I'm getting wiser.", phonetic: "/ˈwaɪzər/" },
      { word: "carry", partOfSpeech: "verbo", spanish: "cargar / llevar", example: "I tried carrying the weight of the world.", phonetic: "/ˈkæri/" },
      { word: "soul", partOfSpeech: "sustantivo", spanish: "alma", example: "Free soul.", phonetic: "/soʊl/" },
      { word: "feel", partOfSpeech: "verbo", spanish: "sentir / sentirse", example: "I didn't know how to feel.", phonetic: "/fiːl/" },
      { word: "belong", partOfSpeech: "verbo", spanish: "pertenecer", example: "I didn't know where I belonged.", phonetic: "/bɪˈlɒŋ/" },
      { word: "over", partOfSpeech: "adverbio/preposición", spanish: "terminado / por encima", example: "When it's all over.", phonetic: "/ˈoʊvər/" },
      { word: "foolish", partOfSpeech: "adjetivo", spanish: "tonto / ingenuo", example: "I was too foolish.", phonetic: "/ˈfuːlɪʃ/" },
      { word: "life", partOfSpeech: "sustantivo", spanish: "vida", example: "Life is a game.", phonetic: "/laɪf/" }
    ]
  },
  {
    week: 11,
    grammarTopic: "Passive Voice",
    grammarES: "Voz Pasiva",
    descriptionES: "Cuando el objeto de la acción es más importante que quien la realiza.",
    song: "Born This Way",
    artist: "Lady Gaga",
    youtubeId: "wV1FrqwZyKw",
    steps: {
      listen: {
        instructions: [
          "Escucha 'Born This Way' — himno de aceptación y orgullo.",
          "El título mismo usa la Voz Pasiva: 'Born' = nacido (participio pasado de 'bear/be born').",
          "Busca otros participios pasados: 'made', 'taught', 'shown'.",
          "Canta el coro con confianza: 'I was born this way!'"
        ],
        tip: "En la Voz Pasiva, el sujeto RECIBE la acción. 'I was born' = alguien me hizo nacer. En la Voz Activa sería 'My mother bore me' — pero nadie dice eso normalmente."
      },
      learn: {
        explanation: "La Voz Pasiva se usa cuando: el agente (quien hace la acción) es desconocido, no importa, o es obvio. Se forma con: be + participio pasado. 'The song was written by Lady Gaga.' Presente: is/are + pp. Pasado: was/were + pp. Si queremos mencionar al agente, usamos 'by'.",
        lyricsExamples: [
          {
            lyric: "I'm beautiful in my way 'cause God makes no mistakes",
            breakdown: "'Makes' — activa. Pero podría ser pasiva: 'No mistakes are made by God' — mismo significado, diferente énfasis."
          },
          {
            lyric: "I was born this way",
            breakdown: "'Was born' — Voz Pasiva en Pasado. Sujeto (I) recibe la acción de nacer. El agente no se menciona."
          },
          {
            lyric: "Don't hide yourself in regret",
            breakdown: "Imperativo activo. En pasiva sería: 'Don't let yourself be hidden by regret'."
          }
        ],
        pattern: {
          title: "Cómo formar la Voz Pasiva",
          rules: [
            "Presente: am/is/are + participio pasado → English is spoken worldwide.",
            "Pasado: was/were + participio pasado → I was born in Colombia.",
            "Con agente: + by + agente → The song was written by Lady Gaga.",
            "Activa → Pasiva: 'Lady Gaga sings this song' → 'This song is sung by Lady Gaga.'"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Transforma a Voz Pasiva o completa el espacio:",
            sentences: [
              { text: "English ___ (speak) in over 50 countries.", answer: "is spoken", hint: "is + participio pasado" },
              { text: "I ___ (born) in this world.", answer: "was born", hint: "was + participio pasado" },
              { text: "The Grammy ___ (give) to Lady Gaga.", answer: "was given", hint: "was + participio pasado" },
              { text: "These lyrics ___ (write) in 2011.", answer: "were written", hint: "were + participio pasado" }
            ]
          },
          {
            type: "match",
            instruction: "Transforma de Activa a Pasiva:",
            pairs: [
              { word: "Lady Gaga wrote the song.", definition: "The song was written by Lady Gaga." },
              { word: "They built this bridge in 1990.", definition: "This bridge was built in 1990." },
              { word: "Someone stole my phone.", definition: "My phone was stolen." },
              { word: "People speak Spanish in Colombia.", definition: "Spanish is spoken in Colombia." }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "Habla sobre ti mismo usando la Voz Pasiva:",
            prompts: [
              "I was born in ___ (city/country).",
              "I was taught English by ___.",
              "This lesson was created to help me ___.",
              "Songs in English are sung by millions of people every day."
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "born", partOfSpeech: "participio / adjetivo", spanish: "nacido / de nacimiento", example: "I was born this way.", phonetic: "/bɔːrn/" },
      { word: "rejoice", partOfSpeech: "verbo", spanish: "regocijarse / celebrar", example: "Rejoice and love yourself today.", phonetic: "/rɪˈdʒɔɪs/" },
      { word: "pride", partOfSpeech: "sustantivo", spanish: "orgullo", example: "Capital H-I-M, show Him some pride.", phonetic: "/praɪd/" },
      { word: "regardless", partOfSpeech: "adverbio", spanish: "sin importar / de todas formas", example: "Regardless of life's losses.", phonetic: "/rɪˈɡɑːrdlɪs/" },
      { word: "regret", partOfSpeech: "sustantivo", spanish: "arrepentimiento / pesar", example: "Don't hide in regret.", phonetic: "/rɪˈɡrɛt/" },
      { word: "mistake", partOfSpeech: "sustantivo", spanish: "error / equivocación", example: "God makes no mistakes.", phonetic: "/mɪˈsteɪk/" },
      { word: "capital", partOfSpeech: "adjetivo/sustantivo", spanish: "mayúscula / capital", example: "Capital H-I-M.", phonetic: "/ˈkæpɪtəl/" },
      { word: "superstar", partOfSpeech: "sustantivo", spanish: "superestrella", example: "Whether life's disabilities made you a superstar.", phonetic: "/ˈsuːpərˌstɑːr/" }
    ]
  },
  {
    week: 12,
    grammarTopic: "Mixed Grammar Review",
    grammarES: "Repaso General de Gramática",
    descriptionES: "Todo lo aprendido en 12 semanas en una sola canción épica.",
    song: "Bohemian Rhapsody",
    artist: "Queen",
    youtubeId: "fJ9rUzIMcZQ",
    steps: {
      listen: {
        instructions: [
          "¡Llegaste a la semana final! Escucha 'Bohemian Rhapsody' completa — 5:55 minutos de pura magia.",
          "Esta canción tiene TODOS los tiempos que aprendiste: presente, pasado, futuro, condicional, modal, pasiva.",
          "Identifica tantos tiempos verbales como puedas mientras escuchas.",
          "Canta cada sección: la balada, la parte operática, el rock. ¡Celebra tu progreso!"
        ],
        tip: "Esta canción es considerada una de las mejores de la historia. ¡Entenderla es una señal de que has progresado muchísimo!"
      },
      learn: {
        explanation: "¡Felicidades por llegar a la Semana 12! Esta semana repasamos todos los tiempos verbales usando 'Bohemian Rhapsody' como contexto total. La canción mezcla: Pasado Simple ('mama, just killed a man'), Presente Simple ('nothing really matters'), Presente Continuo ('I'm just a poor boy'), Presente Perfecto ('I've already spent all my life'), Condicional ('if I'm not back again this time tomorrow'), y Voz Pasiva ('sends shivers down my spine').",
        lyricsExamples: [
          {
            lyric: "Mama, just killed a man — put a gun against his head",
            breakdown: "Pasado Simple: 'killed', 'put'. Acciones completadas en el pasado."
          },
          {
            lyric: "I'm just a poor boy, I need no sympathy",
            breakdown: "Presente Continuo: 'I'm' (I am). Presente Simple: 'need'. Dos tiempos en un verso."
          },
          {
            lyric: "If I'm not back again this time tomorrow, carry on, carry on",
            breakdown: "Primera Condicional: If + presente, imperativo. Phrasal verb: 'carry on'."
          },
          {
            lyric: "Nothing really matters to me",
            breakdown: "Presente Simple con negativo implícito. Filosofía expresada con gramática simple."
          }
        ],
        pattern: {
          title: "Repaso de los 12 tiempos y estructuras",
          rules: [
            "Present Simple: I stand / She stands / Do you stand?",
            "Past Simple: I killed / She went / Did you see?",
            "Present Continuous: I'm learning / She's singing / Are you listening?",
            "Present Perfect: I've won / She has gone / Have you ever...?",
            "Future (will): I will / She won't / Will you?",
            "First Conditional: If + present, will + verb",
            "Modal Verbs: can, should, must, would, might",
            "Passive Voice: is/was + past participle",
            "Comparatives: better than / the best",
            "Phrasal Verbs: wake up, give up, carry on"
          ]
        }
      },
      practice: {
        exercises: [
          {
            type: "fill-blank",
            instruction: "Identifica y completa el tiempo verbal correcto:",
            sentences: [
              { text: "She ___ (kill) a man — Past Simple.", answer: "killed", hint: "verbo regular + ed" },
              { text: "Nothing really ___ (matter) to me — Present Simple.", answer: "matters", hint: "3ra persona + s" },
              { text: "I ___ (carry on) no matter what — Phrasal Verb.", answer: "will carry on", hint: "futuro + phrasal verb" },
              { text: "Spanish ___ (speak) in Colombia — Passive Voice.", answer: "is spoken", hint: "is + participio pasado" }
            ]
          },
          {
            type: "match",
            instruction: "Celebra tu conocimiento: une la estructura con su ejemplo:",
            pairs: [
              { word: "Past Simple", definition: "I went to the concert yesterday." },
              { word: "Present Perfect", definition: "I have listened to this song 100 times." },
              { word: "Passive Voice", definition: "This song was written by Freddie Mercury." },
              { word: "First Conditional", definition: "If you listen every day, you will improve." },
              { word: "Modal Verb", definition: "You should never stop learning English." }
            ]
          },
          {
            type: "speak-aloud",
            instruction: "¡Demuestra todo lo que aprendiste! Habla por 2 minutos sobre:",
            prompts: [
              "What you have learned in these 12 weeks (Present Perfect).",
              "How you felt when you started vs. now (Past Simple / Comparatives).",
              "What you will do with your English from now on (Future).",
              "If you continue practicing, what will happen? (First Conditional)"
            ]
          }
        ]
      }
    },
    vocabulary: [
      { word: "rhapsody", partOfSpeech: "sustantivo", spanish: "rapsodia / composición libre", example: "Bohemian Rhapsody.", phonetic: "/ˈræpsədi/" },
      { word: "bohemian", partOfSpeech: "adjetivo", spanish: "bohemio / libre / artístico", example: "Bohemian lifestyle.", phonetic: "/boʊˈhiːmiən/" },
      { word: "silhouette", partOfSpeech: "sustantivo", spanish: "silueta", example: "I see a little silhouette.", phonetic: "/ˌsɪluˈɛt/" },
      { word: "magnifico", partOfSpeech: "exclamación (italiano)", spanish: "magnífico", example: "Galileo, magnifico!", phonetic: "/mæɡˈnɪfɪkoʊ/" },
      { word: "spare", partOfSpeech: "verbo", spanish: "perdonar / ahorrar", example: "Will you spare his life?", phonetic: "/spɛr/" },
      { word: "shiver", partOfSpeech: "verbo/sustantivo", spanish: "escalofrío / temblar", example: "Sends shivers down my spine.", phonetic: "/ˈʃɪvər/" },
      { word: "beelzebub", partOfSpeech: "nombre propio", spanish: "Belcebú / el diablo", example: "Beelzebub has a devil put aside for me.", phonetic: "/biːˈɛlzɪbʌb/" },
      { word: "matter", partOfSpeech: "verbo", spanish: "importar", example: "Nothing really matters.", phonetic: "/ˈmætər/" }
    ]
  }
];
