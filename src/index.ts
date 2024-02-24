
const init = () => {
    const canvas = <HTMLCanvasElement>document.getElementById("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) return;

    // Start a new Path
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(300, 222);

    // Draw the Path
    ctx.stroke();
}

init();