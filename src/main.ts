import Scene from "./Scene";
import {
    FRAMES_BETWEEN_BUBBLES,
    WAVE_AMPLITUDE,
    WAVE_BOUNCE_FACTOR,
    WAVES_PER_SECOND,
    X_SCALE,
    Y_SCALE,
} from "./settings";

const canvas = document.querySelector("canvas") as HTMLCanvasElement;
canvas.style.width = `${innerWidth}px`;
canvas.style.height = `${innerHeight}px`;
canvas.width = Math.floor(innerWidth * X_SCALE);
canvas.height = Math.floor(innerHeight * Y_SCALE);
const context = canvas.getContext("2d") as CanvasRenderingContext2D;

const result = context.createImageData(canvas.width, canvas.height);
const yoffset = canvas.width * 4;
let angleOffset = 0;
const angleIncrement = (Math.PI * 2 / 60) * WAVES_PER_SECOND;

const xCount = canvas.width - (2 * WAVE_AMPLITUDE);
const yCount = canvas.height - (2 * WAVE_AMPLITUDE);
const xyCount = xCount * yCount;
const angleCount = 60 / WAVES_PER_SECOND;

// Precalculated look up tables for mapping source pixels (original image) to destination pixels (distorted image)
const srcTable = new Uint32Array(angleCount * xCount * yCount);
const destTable = new Uint32Array(angleCount * xCount * yCount);
let tableIndex = 0;

function calculateSrcAndDestValues(): void {
    while (true) {
        if (angleOffset >= Math.PI * 2) {
            angleOffset = 0;
            tableIndex = 0;
            break;
        }

        for (let x = WAVE_AMPLITUDE; x < canvas.width - WAVE_AMPLITUDE; x++) {
            const xquotient = x / canvas.height;
            for (let y = WAVE_AMPLITUDE; y < canvas.height - WAVE_AMPLITUDE; y++) {
                const xs = WAVE_AMPLITUDE * Math.sin((WAVE_BOUNCE_FACTOR * xquotient + angleOffset));
                const ys = WAVE_AMPLITUDE * Math.cos((WAVE_BOUNCE_FACTOR * (y / canvas.width) + angleOffset));
                const dest = y * yoffset + x * 4;
                const src = (y + Math.round(ys)) * yoffset + (x + Math.round(xs)) * 4;
                destTable[tableIndex] = dest;
                srcTable[tableIndex] = src;
                tableIndex++;
            }
        }

        angleOffset += angleIncrement;
    }
}

function applyWaveEffect() {
    const source = context.getImageData(0, 0, canvas.width, canvas.height);

    if (angleOffset >= Math.PI * 2) {
        angleOffset = 0;
        tableIndex = 0;
    }
    angleOffset += angleIncrement;

    for (let i = 0; i < xyCount; i++) {
        const dest = destTable[tableIndex];
        const src = srcTable[tableIndex];
        result.data[dest] = source.data[src];
        result.data[dest + 1] = source.data[src + 1];
        result.data[dest + 2] = source.data[src + 2];
        result.data[dest + 3] = source.data[src + 3];
        tableIndex++;
    }

    context.putImageData(result, 0, 0);
}

canvas.addEventListener("click", (event: MouseEvent) => {
    const bubbleX = event.offsetX * X_SCALE;
    const bubbleY = event.offsetY * Y_SCALE;
    scene.addBubbleAtPoint(bubbleX, bubbleY);
});

calculateSrcAndDestValues();

let currentFrame = 0;
const scene = new Scene(context);
function renderScene(): void {
    if (currentFrame % FRAMES_BETWEEN_BUBBLES === 0) {
        scene.addRandomBubble();
    }
    scene.render(context);
    applyWaveEffect();
    currentFrame++;
    requestAnimationFrame(renderScene);
}

renderScene();
