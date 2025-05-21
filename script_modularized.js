// Initialize WebSocket connection and Page
        let ws;
        let isPromotedClient = false;
        let redirectTimerQueued = null;
        let wakeLock = null;

        function initializePage() {
            document.getElementById("queueMessage").style.display = "flex";
            document.getElementById("queueMessage").classList.add("fade-in");

            // Attiva il fade-in manuale delle particelle
            setTimeout(() => {
                document.getElementById("particles-js").style.opacity = "1";
            }, 100); // leggerissimo delay dopo DOM ready

            connectWebSocket();
        }

        async function requestWakeLock() {
                try {
                    wakeLock = await navigator.wakeLock.request("screen");
                    console.log("Wake Lock attivo");

                    // Rinnova se viene rilasciato
                    wakeLock.addEventListener("release", () => {
                        console.log("Wake Lock rilasciato");
                    });
                } catch (err) {
                    console.error(`Wake Lock fallito: ${err.name}, ${err.message}`);
                } finally {
                    // In ogni caso, attiva anche il fallback video invisibile
                    startFallbackVideo();
                }

            }
        
        let fallbackRetryInterval = null;

        function startFallbackVideo() {
            const video = document.getElementById("wakelockVideo");
            if (!video) return;

            function tryPlay() {
                if (!video.paused) {
                    clearInterval(fallbackRetryInterval);
                    return;
                }

                const playAttempt = video.play();
                if (playAttempt !== undefined) {
                    playAttempt.then(() => {
                        clearInterval(fallbackRetryInterval);
                    }).catch(() => {
                        // Silenzioso: nessun log
                    });
                }
            }

            tryPlay();
            fallbackRetryInterval = setInterval(tryPlay, 2000);
        }

        // Initialize Particles.js
        particlesJS("particles-js", {
            "particles": {
                "number": { "value": 200, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "random": true },
                "size": { "value": 2, "random": true },
                "move": { "enable": true, "speed": 0.5, "direction": "none", "random": true, "straight": false, "out_mode": "out" },
                "line_linked": { "enable": false }
            },
            "interactivity": { "detect_on": "canvas", "events": { "onhover": { "enable": false }, "onclick": { "enable": false }, "ontouch": { "enable": false } } },
            "retina_detect": true
        });

        function checkOrientation() {
            const rotateMessage = document.getElementById("rotateMessage");
            if (window.innerHeight > window.innerWidth) {
                rotateMessage.style.display = "flex"; // Show message in portrait mode
            } else {
                rotateMessage.style.display = "none"; // Hide message in landscape mode
            }
        }

        function showPhoneWarning() {
            const warning = document.getElementById("phoneWarningScreen");
            warning.style.display = "block";
            warning.classList.add("fade-in");

            setTimeout(() => {
                warning.classList.remove("fade-in"); // rimuovi l'ingresso
                warning.classList.add("fade-out");

                warning.addEventListener("animationend", function handleFadeOut() {
                    warning.removeEventListener("animationend", handleFadeOut); // cleanup
                    warning.style.display = "none";
                    getUserInfo(); // chiamato solo dopo che l'animazione è davvero finita
                });
            }, 7000);
        }


        function getUserInfo() {
            document.getElementById("infoScreen").style.display = "block";
            document.getElementById("infoScreen").classList.add("fade-in");

            const lang = navigator.language || navigator.userLanguage;
            const baseLang = lang.split("-")[0];

            const greetings = {
                en: "Hello",
                it: "Ciao",
                fr: "Salut",
                de: "Hallo",
                es: "Hola",
                pt: "Olá",
                nl: "Hallo",
                sv: "Hej",
                no: "Hei",
                da: "Hej",
                fi: "Hei",
                pl: "Cześć",
                cs: "Ahoj",
                hu: "Szia",
                tr: "Merhaba",       // turco
                el: "Γεια",          // greco
                ar: "مرحبا",         // arabo
                fa: "سلام",           // persiano
                he: "שלום",           // ebraico
                hi: "नमस्ते",          // hindi
                ko: "안녕하세요",       // coreano
                ja: "こんにちは",       // giapponese
                zh: "你好",           // cinese
                ru: "Привет",         // russo
                uk: "Привіт",         // ucraino
                ro: "Salut",
                th: "สวัสดี",         // thailandese
                id: "Halo",          // indonesiano
                vi: "Xin chào"       // vietnamita
            };

            const altGreeting = greetings[baseLang] || "hello";
            document.getElementById("welcomeMessage").innerHTML = `Hi... or should I say <span style="font-style: italic;">${altGreeting}</span>?`;
            // ⏳ Attendi prima di passare alla schermata successiva
            
            setTimeout(() => {
                TransitionScreen();
            }, 5000); // 5 secondi (modificabile)
        }

        function TransitionScreen() {
            document.getElementById("infoScreen").classList.add("fade-out");

            setTimeout(() => {
                document.getElementById("infoScreen").style.display = "none";
                document.getElementById("transitionScreen").style.display = "block";

                // Passa automaticamente al form dopo 5s
                setTimeout(() => {
                    proceedToForm();
                }, 5000);
            }, 3000); // attende il fade-out
        }

        function proceedToForm() {
            document.getElementById("transitionScreen").classList.add("fade-out");
            setTimeout(() => {
                document.getElementById("transitionScreen").style.display = "none";
                document.getElementById("formSection").style.display = "block";
            }, 3000);
        }

        function validateForm() {
            startFallbackVideo()
            let firstName = document.getElementById("firstName").value.trim();
            let lastName = document.getElementById("lastName").value.trim();
            let email = document.getElementById("email").value.trim();

            if (!firstName || !lastName || !email) {
                alert("All fields are required!");
                return;
            }

            // Verifica il formato dell'email
            if (!isValidEmail(email)) {
                alert("Please enter a valid email address!");
                return;
            }

            // Invia i dati via WebSocket
            const userData = {
                firstName: firstName,
                lastName: lastName,
                email: email
            };

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(userData));
                console.log("Dati inviati:", userData);
            } else {
                console.error("WebSocket non connesso. Riprova più tardi.");
            }

            goToProcessing();

        }

        function isValidEmail(email) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailPattern.test(email);
        }

        function goToProcessing() {
                document.getElementById("formSection").classList.add("fade-out");
                setTimeout(() => {
                    document.getElementById("formSection").style.display = "none";
                    document.getElementById("processingSection").style.display = "block";
                }, 3000);
            }
        
        function goToPreQuestion() {
            document.getElementById("processingSection").classList.add("fade-out");

            setTimeout(() => {
                document.getElementById("processingSection").style.display = "none";
                document.getElementById("preQuestionScreen").style.display = "block";

                // ⏳ Dopo 40 secondi → chiama goToQuestion()
                setTimeout(goToQuestion, 40000);

            }, 3000); // attesa dopo il fade-out del processing
        }


        function goToQuestion() {
            document.getElementById("preQuestionScreen").classList.add("fade-out");
            setTimeout(() => {
                document.getElementById("preQuestionScreen").style.display = "none";
                document.getElementById("questionSection").style.display = "block";
            }, 3000);
        }

        function answerYes() {
            document.getElementById("questionSection").classList.add("fade-out");

            setTimeout(() => {
                document.getElementById("questionSection").style.display = "none";

                // Ora controlliamo se l'utente è in portrait
                if (window.innerHeight > window.innerWidth) {
                    // Mostra il messaggio di rotazione
                    document.getElementById("rotateMessage").style.display = "flex";

                    // Imposta un listener per procedere automaticamente quando ruota
                    const waitForRotation = () => {
                        document.getElementById("questionSection").style.display = "none";
                        if (window.innerWidth > window.innerHeight) {
                            document.getElementById("rotateMessage").style.display = "none";
                            document.getElementById("canvasSection").style.display = "block";
                            setupCanvas();
                        }
                    };

                    window.addEventListener("resize", waitForRotation, { once: true });
                } else {
                    // Se è già in landscape, continua normalmente
                    document.getElementById("canvasSection").style.display = "block";
                    setupCanvas();
                }
            }, 3000);
        }

        function answerNo() {
            document.getElementById("questionSection").classList.add("fade-out");
            setTimeout(() => {
                document.getElementById("questionSection").style.display = "none";
                // Invia il messaggio di reset data research
                sendClearMessage();

                goToNoToContract();
            }, 3000);
        }

        function goToNoToContract() {
                document.getElementById("questionSection").classList.add("fade-out");

                setTimeout(() => {
                    document.getElementById("noToContractScreen").style.display = "block";

                            // Dopo 8s → passa alla Thank You
                    setTimeout(() => {
                        document.getElementById("noToContractScreen").classList.add("fade-out");
                        setTimeout(showThankYouPage, 3000);
                    }, 8000);

                }, 8000);
            }

        function goToCanvas() {
            document.getElementById("formSection").classList.add("fade-out");
            setTimeout(() => {
                document.getElementById("formSection").style.display = "none";
                document.getElementById("canvasSection").style.display = "block";
                setupCanvas();
            }, 6000);
        }

        function setupCanvas() {
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            const submitBtn = document.getElementById("submitDrawingBtn");

            canvas.width = canvas.clientWidth;
            canvas.height = canvas.clientHeight;

            let isDrawing = false;

            function startDrawing(event) {
                event.preventDefault();
                isDrawing = true;
                ctx.beginPath();
                const { x, y } = getCoords(event);
                ctx.moveTo(x, y);
            }

            function draw(event) {
                event.preventDefault();
                if (!isDrawing) return;

                const { x, y } = getCoords(event);
                ctx.lineTo(x, y);
                ctx.strokeStyle = "white";
                ctx.lineWidth = 3;
                ctx.lineCap = "round";
                ctx.stroke();

                // Enable "Submit" only if something is drawn
                if (!submitBtn.disabled) return;
                submitBtn.disabled = false;
            }

            function stopDrawing(event) {
                event.preventDefault();
                isDrawing = false;
                ctx.beginPath();
            }

            function getCoords(event) {
                const rect = canvas.getBoundingClientRect();
                const x = event.touches ? event.touches[0].clientX - rect.left : event.clientX - rect.left;
                const y = event.touches ? event.touches[0].clientY - rect.top : event.clientY - rect.top;
                return { x, y };
            }

            canvas.addEventListener("mousedown", startDrawing);
            canvas.addEventListener("mousemove", draw);
            canvas.addEventListener("mouseup", stopDrawing);

            canvas.addEventListener("touchstart", startDrawing, { passive: false });
            canvas.addEventListener("touchmove", draw, { passive: false });
            canvas.addEventListener("touchend", stopDrawing);
        }

        function clearCanvas() {
            const canvas = document.getElementById("canvas");
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            document.getElementById("submitDrawingBtn").disabled = true;
        }

        function processSignatureCanvas(canvas) {
            const upscaleFactor = 2;

            // Crea canvas temporaneo ingrandito
            const tmpCanvas = document.createElement("canvas");
            tmpCanvas.width = canvas.width * upscaleFactor;
            tmpCanvas.height = canvas.height * upscaleFactor;
            const tmpCtx = tmpCanvas.getContext("2d");

            tmpCtx.imageSmoothingEnabled = true;
            tmpCtx.imageSmoothingQuality = "high";
            tmpCtx.drawImage(canvas, 0, 0, tmpCanvas.width, tmpCanvas.height);

            // Inverti colori chiari (quasi bianchi) in nero
            const imageData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const [r, g, b, a] = [data[i], data[i+1], data[i+2], data[i+3]];
                if (a > 10 && r > 200 && g > 200 && b > 200) {
                    data[i] = 0;     // R
                    data[i + 1] = 0; // G
                    data[i + 2] = 0; // B
                }
            }
            tmpCtx.putImageData(imageData, 0, 0);

            // Ridimensiona con antialiasing
            const finalCanvas = document.createElement("canvas");
            finalCanvas.width = canvas.width;
            finalCanvas.height = canvas.height;
            const finalCtx = finalCanvas.getContext("2d");
            finalCtx.imageSmoothingEnabled = true;
            finalCtx.imageSmoothingQuality = "high";
            finalCtx.drawImage(tmpCanvas, 0, 0, canvas.width, canvas.height);

            return finalCanvas.toDataURL("image/png");
        }

        function submitDrawing() {
            const canvas = document.getElementById("canvas");
            // Ottieni l'immagine in formato base64
            const dataURL = processSignatureCanvas(canvas);

            // Costruisci il payload includendo i dati della firma
            const drawingData = {
                type: "firma",
                firma: dataURL
            };

            // Invia il payload tramite WebSocket, se connesso
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(drawingData));
                console.log("Firma inviata:", drawingData);
                sendDissolveMessage()
            } else {
                console.error("WebSocket non connesso. Riprova più tardi.");
            }

            goToNotForgotten();

        }

        function sendDissolveMessage() {
            const message = {
                action: "dissolve_data"
            };

            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                console.log("Messaggio di cancellazione inviato:", message);
            } else {
                console.error("WebSocket non connesso. Riprova più tardi.");
            }
        }

        function goToNotForgotten() {
                document.getElementById("canvasSection").classList.add("fade-out");

                setTimeout(() => {
                    document.getElementById("canvasSection").style.display = "none";
                    document.getElementById("notForgottenScreen").style.display = "block";

                    // Dopo 15s → passa alla Thank You
                    setTimeout(() => {
                        goToEmailNotice();
                    }, 10000);

                }, 3000); // attesa per fade-out canvas
            }
            
        
        function goToEmailNotice() {
            document.getElementById("notForgottenScreen").classList.add("fade-out");

            setTimeout(() => {
                document.getElementById("notForgottenScreen").style.display = "none";
                document.getElementById("emailNoticeScreen").style.display = "block";

                // Dopo 10s → passa alla Thank You
                setTimeout(() => {
                    document.getElementById("emailNoticeScreen").classList.add("fade-out");
                    setTimeout(showThankYouPage, 3000);
                }, 10000);
            }, 3000); // attende il fade-out
        }

        function showThankYouPage() {
            /*document.getElementById("canvasSection").style.display = "none";*/
            document.getElementById("emailNoticeScreen").style.display = "none";
            document.getElementById("noToContractScreen").style.display = "none";

            const thankYou = document.getElementById("thankYouSection");
            const particles = document.getElementById("particles-js");

            // Mostra la sezione finale
            thankYou.style.display = "block";

            // Dopo un po', esegui il fade-out del testo e del particellare
            setTimeout(() => {
                thankYou.classList.add("fade-out");
                particles.classList.add("fade-out");

                // Attendi 5s di buio prima del reindirizzamento
                setTimeout(() => {
                    window.location.href = "https://linktr.ee/maalex_reflurapid";
                }, 5000);

            }, 15000); // dopo 10s di messaggio visibile
            
        }

        let hasHandledConnected = false;
        let hasHandledQueued = false;
        let hasHandledReadyForQuestion = false;


        function connectWebSocket() {
            if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
                console.warn("WebSocket già attivo. Chiusura in corso...");
                ws.close();
            }

            ws = new WebSocket("wss://websocket-server-vfu2.onrender.com/");

            ws.onopen = () => {
                console.log("WebSocket connected!");
                // Handshake iniziale
                ws.send(JSON.stringify({ role: "web_user" }));
            };

            ws.onerror = (error) => { 
                console.error("WebSocket error:", error)
            };

            ws.onmessage = (event) => {
                console.log("Message from server:", event.data);

                let data;
                try {
                    data = JSON.parse(event.data);
                } catch (e) {
                    data = event.data;  // se non è JSON, tienilo come semplice stringa
                }

                if ((data === "connected" || (typeof data === "object" && data.status === "connected")) && !hasHandledConnected) {
                    hasHandledConnected = true;  // per attivare gli eventi relativi a questo messaggio solo una volta
                    if (redirectTimerQueued !== null) {
                        clearTimeout(redirectTimerQueued);
                        redirectTimerQueued = null;
                        console.log(" Reindirizzamento da annullato: client promosso");
                    }

                    isPromotedClient = true;  // Client promosso

                    if ('wakeLock' in navigator) {
                        requestWakeLock();
                    } else {
                        startFallbackVideo(); // per browser che non supportano wakeLock (es. iOS)
                    }

                    ws.send(JSON.stringify({action: "user_connected"}));
                    console.log("Messaggio inviato a Python: user_connected");

                    document.getElementById("queueMessage").style.display = "none";
                    document.getElementById("phoneWarningScreen").style.display = "block";

                    //  Avvia la transizione dopo 5 secondi
                    setTimeout(() => {
                        showPhoneWarning();
                    }, 5000);

                } else if ((data === "queued" || (typeof data === "object" && data.status === "queued")) && !hasHandledQueued) {
                    hasHandledQueued = true;   // per attivare gli eventi relativi a questo messaggio solo una volta
                    isPromotedClient = false;  // Non è il client attivo
                    document.getElementById("queueMessage").style.display = "block";
                    document.getElementById("phoneWarningScreen").style.display = "none";

                    //  Dopo 10 secondi, reindirizza
                    redirectTimerQueued = setTimeout(() => {
                        window.location.href = "https://linktr.ee/maalex_reflurapid";
                    }, 20000);
                }
                
                else if (typeof data === "object" && data.status === "ready_for_question" && !hasHandledReadyForQuestion) {
                    hasHandledReadyForQuestion = true;  // per attivare gli eventi relativi a questo messaggio solo una volta
                    if (isPromotedClient) {
                        setTimeout(() => {goToPreQuestion();}, 3000);
                    }
                }
            };

            ws.onclose = () => {
                console.log("WebSocket disconnected. Reconnecting in 3 seconds...");
                setTimeout(connectWebSocket, 3000);
            };
        }

        let clearAlreadySent = false;

        function sendClearMessage() {
            if (!isPromotedClient || clearAlreadySent) return;
            clearAlreadySent = true;

            const message = { action: "clear_variable" };
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify(message));
                console.log("clear_variable inviato");
            } else {
                console.warn("WebSocket chiuso. clear_variable non inviato.");
            }
        }

        let inactivityTimeout;

        function resetInactivityTimer() {
            clearTimeout(inactivityTimeout);
            inactivityTimeout = setTimeout(() => {
                if (isPromotedClient) {
                    sendClearMessage();
                }
                window.location.href = "https://linktr.ee/maalex_reflurapid";
            }, 180000); // 3 minuti = 180000 ms
        }

        document.addEventListener("mousemove", resetInactivityTimer);
        document.addEventListener("keydown", resetInactivityTimer);
        document.addEventListener("click", resetInactivityTimer);
        document.addEventListener("touchstart", resetInactivityTimer);

        // Avvia il timer al caricamento
        resetInactivityTimer();

        // Eventi di cambio di visibilità della pagina
        let clearHiddenTimer = null;
        let hiddenTimeout = null;

        document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "hidden" && isPromotedClient) {
            console.log("Scheda in background. Avvio timer di 60s per inviare clear_variable...");
            clearHiddenTimer = setTimeout(() => {
            console.log("120s trascorsi. Invio clear_variable.");
            sendClearMessage();
            }, 120000);

            hiddenTimeout = setTimeout(() => {
            console.log("60s passati in background → reindirizzamento forzato.");
            window.location.href = "https://linktr.ee/maalex_reflurapid";
            }, 60000);
        } else if (document.visibilityState === "visible") {
            console.log("Pagina visibile di nuovo. Timer annullato.");
            clearTimeout(clearHiddenTimer);
            clearTimeout(hiddenTimeout);
            clearHiddenTimer = null;
            hiddenTimeout = null;

            if ('wakeLock' in navigator) requestWakeLock();

            if (localStorage.getItem("wasHidden") === "true") {
            localStorage.removeItem("wasHidden");
            // location.reload(); // opzionale
            }
        }
        });

        //Eventi di chiusura / reindirizzamento
        window.addEventListener("unload", sendClearMessage);
        window.addEventListener("beforeunload", sendClearMessage);
        // Quando la pagina viene realmente chiusa o ricaricata
        window.addEventListener("pagehide", () => {
            localStorage.setItem("wasHidden", "true");
            sendClearMessage();
        });

        
        function showOnly(sectionId) {
            const allSections = [
                "queueMessage", "phoneWarningScreen", "infoScreen", "transitionScreen", "formSection",
                "processingSection", "preQuestionScreen", "questionSection",
                "noToContractScreen", "canvasSection", "notForgottenScreen", "emailNoticeScreen", "thankYouSection"
            ];

            allSections.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.display = "none";
            });

            const target = document.getElementById(sectionId);
            if (target) {
                target.style.display = "block";
            }
        }
