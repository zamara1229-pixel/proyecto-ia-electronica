// Si tienes un modelo real de Teachable Machine, pon tu URL aquí
const URL_MODELO = ""; // Deja vacío para modo demostración

let model, webcam, labelContainer, maxPredictions;
let modoSimulacion = true;

async function init() {
    try {
        if (URL_MODELO && URL_MODELO !== "") {
            try {
                const modelURL = URL_MODELO + "model.json";
                const metadataURL = URL_MODELO + "metadata.json";
                model = await tmImage.load(modelURL, metadataURL);
                maxPredictions = model.getTotalClasses();
                modoSimulacion = false;
                document.getElementById("modo-aviso").innerHTML = "✅ Modo IA activado";
            } catch(e) {
                modoSimulacion = true;
                document.getElementById("modo-aviso").innerHTML = "🔧 Modo demostración activado";
            }
        } else {
            modoSimulacion = true;
            document.getElementById("modo-aviso").innerHTML = "🔧 Modo demostración - Reconoce por color";
        }
        
        const flip = true;
        webcam = new tmImage.Webcam(200, 200, flip);
        await webcam.setup();
        await webcam.play();
        
        document.getElementById("webcam-container").innerHTML = "";
        document.getElementById("webcam-container").appendChild(webcam.canvas);
        
        labelContainer = document.getElementById("label-container");
        labelContainer.innerHTML = "";
        
        if (!modoSimulacion && maxPredictions) {
            for (let i = 0; i < maxPredictions; i++) {
                labelContainer.appendChild(document.createElement("div"));
            }
        } else {
            labelContainer.innerHTML = "<div>🔍 Apunta: LED (rojo), Resistencia (beige) o ESP32 (verde)</div>";
        }
        
        window.requestAnimationFrame(loop);
        
    } catch (error) {
        document.getElementById("webcam-container").innerHTML = `
            <p style="color:red; background:white; padding:10px; border-radius:10px;">
                ❌ Error al acceder a la cámara. Asegúrate de dar permisos.
            </p>
        `;
    }
}

async function loop() {
    if (webcam && webcam.canvas) {
        webcam.update();
        if (!modoSimulacion && model) {
            await predictConModelo();
        } else {
            await detectarPorColor();
        }
    }
    window.requestAnimationFrame(loop);
}

async function predictConModelo() {
    try {
        const prediction = await model.predict(webcam.canvas);
        prediction.sort((a, b) => b.probability - a.probability);
        if (prediction[0].probability > 0.7) {
            mostrarFicha(prediction[0].className);
        }
    } catch(e) {}
}

async function detectarPorColor() {
    try {
        const canvas = webcam.canvas;
        const ctx = canvas.getContext("2d");
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        let r = 0, g = 0, b = 0, total = 0;
        for (let i = 0; i < data.length; i += 100) {
            r += data[i];
            g += data[i+1];
            b += data[i+2];
            total++;
        }
        r /= total; g /= total; b /= total;
        
        let componente = "";
        if (r > g && r > b && r > 100) componente = "LED";
        else if (g > r && g > b && g > 100) componente = "ESP32";
        else componente = "Resistencia";
        
        mostrarFicha(componente);
    } catch(e) {}
}

function mostrarFicha(componente) {
    const fichas = {
        "LED": {
            nombre: "LED (Diodo Emisor de Luz)",
            origen: "1962 - Nick Holonyak Jr.",
            curiosidad: "Consume 90% menos energía que una bombilla",
            polaridad: "Ánodo (+): pata larga | Cátodo (-): pata corta",
            voltaje: "1.8V a 3.3V",
            usos: "Indicadores, iluminación, sensores",
            importancia: "Revolucionó la iluminación por su eficiencia"
        },
        "Resistencia": {
            nombre: "Resistor",
            origen: "1827 - Georg Ohm",
            curiosidad: "Bandas de colores indican su valor en ohmios",
            polaridad: "No tiene polaridad",
            voltaje: "V = I × R (Ley de Ohm)",
            usos: "Limitar corriente, divisor de voltaje",
            importancia: "Componente más común en electrónica"
        },
        "ESP32": {
            nombre: "ESP32-WROOM-32",
            origen: "2016 - Espressif Systems",
            curiosidad: "WiFi y Bluetooth integrados por $5-10 USD",
            polaridad: "Solo acepta 3.3V en pines GPIO",
            voltaje: "3.3V (alimentación), 5V por USB",
            usos: "IoT, robótica, automatización",
            importancia: "Revolucionó el IoT por bajo costo"
        }
    };

    const infoDiv = document.getElementById("info-componente");
    if (fichas[componente]) {
        infoDiv.innerHTML = `
            <div class="ficha-activa">
                <h3 style="color:#0066cc;">🔧 ${componente}</h3>
                <p><strong>📛 Nombre:</strong> ${fichas[componente].nombre}</p>
                <p><strong>🌍 Origen:</strong> ${fichas[componente].origen}</p>
                <p><strong>💡 Curiosidad:</strong> ${fichas[componente].curiosidad}</p>
                <p><strong>⚡ Polaridad:</strong> ${fichas[componente].polaridad}</p>
                <p><strong>🔋 Voltaje:</strong> ${fichas[componente].voltaje}</p>
                <p><strong>🛠️ Usos:</strong> ${fichas[componente].usos}</p>
                <p><strong>⭐ Importancia:</strong> ${fichas[componente].importancia}</p>
            </div>
        `;
    } else {
        infoDiv.innerHTML = `<p>⚠️ Componente no reconocido</p>`;
    }
}

let codigoActual = "";

function abrirModal(componente) {
    const modal = document.getElementById("modal");
    const titulo = document.getElementById("modal-titulo");
    const codigoElemento = document.getElementById("modal-codigo");
    
    let codigo = "";
    switch(componente) {
        case "LED":
            titulo.innerHTML = "💡 Código para encender un LED con Arduino";
            codigo = `int ledPin = 13;

void setup() {
    pinMode(ledPin, OUTPUT);
}

void loop() {
    digitalWrite(ledPin, HIGH);
    delay(1000);
    digitalWrite(ledPin, LOW);
    delay(1000);
}`;
            break;
        case "Resistencia":
            titulo.innerHTML = "🔌 Código para leer una resistencia (LDR)";
            codigo = `int ldrPin = A0;

void setup() {
    Serial.begin(9600);
}

void loop() {
    int valor = analogRead(ldrPin);
    Serial.println(valor);
    delay(500);
}`;
            break;
        case "ESP32":
            titulo.innerHTML = "📡 Conectar ESP32 a WiFi";
            codigo = `#include <WiFi.h>

const char* ssid = "TU_WIFI";
const char* password = "TU_PASSWORD";

void setup() {
    Serial.begin(115200);
    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("Conectado!");
}`;
            break;
    }
    codigoActual = codigo;
    codigoElemento.textContent = codigo;
    modal.style.display = "flex";
}

function cerrarModal() {
    document.getElementById("modal").style.display = "none";
}

function copiarCodigo() {
    navigator.clipboard.writeText(codigoActual);
    alert("✅ Código copiado");
}

window.onclick = function(event) {
    const modal = document.getElementById("modal");
    if (event.target === modal) modal.style.display = "none";
}
function irJuego() {
    document.getElementById("portada").style.display = "none";
    document.getElementById("modelo").style.display = "none";
    document.getElementById("juego").style.display = "block";
}