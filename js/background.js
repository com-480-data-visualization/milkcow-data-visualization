const canvas = document.getElementById('background-canvas');
const ctx = canvas.getContext('2d');

let canvas_width = canvas.width = window.innerWidth;
let canvas_height = canvas.height = window.innerHeight;

function gaussian2D(x, y, cx, cy, sigma) {
    const dx = x - cx;
    const dy = y - cy;
    return Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
}

function smoother(x, smoothness) {
    return (1 - Math.exp(-x * smoothness))
}

function createGaussianKernel(sigma) {
    const mat = [];
    const maxRadius = sigma * 4; // Gaussian influence radius
    const size = maxRadius * 2 + 1;
    const center = Math.floor(size / 2);
    for (let y = 0; y < size; y++) {
        mat[y] = [];
        for (let x = 0; x < size; x++) {
            const dx = x - center;
            const dy = y - center;
            const value = Math.exp(-(dx * dx + dy * dy) / (2 * sigma * sigma));
            mat[y][x] = value;
        }
    }
    return mat;
}

function simulateGravity(particles, steps, dt = 1e-7, G = 1e-7, radius_scale = 1.0, margin = 10) {
    for (let step = 0; step < steps; step++) {
        const accelerations = particles.map(() => ({ ax: 0, ay: 0 }));

        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[j].x - particles[i].x;
                const dy = particles[j].y - particles[i].y;
                const distSq = dx * dx + dy * dy + 1e-6;
                const dist = Math.sqrt(distSq);
                const force = G * particles[i].sigma * particles[j].sigma / distSq;

                const fx = force * dx / dist;
                const fy = force * dy / dist;

                accelerations[i].ax += fx / particles[i].sigma;
                accelerations[i].ay += fy / particles[i].sigma;
                accelerations[j].ax -= fx / particles[j].sigma;
                accelerations[j].ay -= fy / particles[j].sigma;

                const radius_i = Math.sqrt(particles[i].sigma) * radius_scale;
                const radius_j = Math.sqrt(particles[j].sigma) * radius_scale;
                const minDist = radius_i + radius_j;

                if (dist < minDist) {
                    // --- Elastic Collision ---
                    const nx = dx / dist;
                    const ny = dy / dist;

                    const tx = -ny;
                    const ty = nx;

                    // Project velocities onto the normal and tangent vectors
                    const vi_n = particles[i].vx * nx + particles[i].vy * ny;
                    const vj_n = particles[j].vx * nx + particles[j].vy * ny;

                    const vi_t = particles[i].vx * tx + particles[i].vy * ty;
                    const vj_t = particles[j].vx * tx + particles[j].vy * ty;

                    const mi = particles[i].sigma;
                    const mj = particles[j].sigma;

                    // Elastic collision equation for normal components (1D)
                    const vi_n_after = (vi_n * (mi - mj) + 2 * mj * vj_n) / (mi + mj);
                    const vj_n_after = (vj_n * (mj - mi) + 2 * mi * vi_n) / (mi + mj);

                    // Convert scalar normal and tangential velocities into vectors
                    particles[i].vx = vi_n_after * nx + vi_t * tx;
                    particles[i].vy = vi_n_after * ny + vi_t * ty;

                    particles[j].vx = vj_n_after * nx + vj_t * tx;
                    particles[j].vy = vj_n_after * ny + vj_t * ty;

                    // Optional: separate the particles slightly to prevent overlap
                    const overlap = 0.5 * (minDist - dist + 1e-3);
                    particles[i].x -= overlap * nx;
                    particles[i].y -= overlap * ny;
                    particles[j].x += overlap * nx;
                    particles[j].y += overlap * ny;
                }
            }
        }

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            const a = accelerations[i];

            p.vx += a.ax * dt;
            p.vy += a.ay * dt;

            p.x += p.vx * dt;
            p.y += p.vy * dt;

            if (p.x < margin) {
                p.x = margin;
                p.vx *= -1;
            } else if (p.x > canvas_width - margin) {
                p.x = canvas_width - margin;
                p.vx *= -1;
            }

            if (p.y < margin) {
                p.y = margin;
                p.vy *= -1;
            } else if (p.y > canvas_height - margin) {
                p.y = canvas_height - margin;
                p.vy *= -1;
            }
        }
    }

    return particles;
}

function initKernels(n) {
    const kernels = [];
    for (let i = 0; i < n; i++) {
        kernels.push({
            x: Math.floor(Math.random() * canvas_width),
            y: Math.floor(Math.random() * canvas_height),
            sigma: Math.ceil(Math.random() * 2) * 10 + 20,
            matrix: 0,
            vx: 0,
            vy: 0,
        });
    }

    simulateGravity(kernels, 10)

    kernels.forEach(function (k) {
        k.matrix = gaussians[k.sigma / 10 - 2]
    })
    return kernels;
}


function drawSumOfGaussians() {
    const sumBuffer = new Float32Array(canvas_width * canvas_height);
    
    for (const kernel of kernels) {
        const maxRadius = 4 * kernel.sigma;
        const startX = Math.max(0, kernel.x - maxRadius);
        const endX = Math.min(canvas_width, kernel.x + maxRadius);
        const startY = Math.max(0, kernel.y - maxRadius);
        const endY = Math.min(canvas_height, kernel.y + maxRadius);
        
        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const kx = Math.floor(x - kernel.x + maxRadius);
                const ky = Math.floor(y - kernel.y + maxRadius);
                const value = kernel.matrix[ky][kx];
                sumBuffer[y * canvas_width + x] += value;
            }
        }
    }
    
    const imageData = ctx.createImageData(canvas_width, canvas_height);
    const data = imageData.data;

    for (let i = 0; i < sumBuffer.length; i++) {
        const value = sumBuffer[i];
        const index = i * 4;
        const alpha = Math.min(255, (value - threshold) / (1 - threshold) * 255);
        
        if (value > threshold) {
            data[index] = 0;
            data[index + 1] = 0;
            data[index + 2] = 0;
            data[index + 3] = 255 * smoother(alpha / 255, 500);
        } else {
            data[index + 3] = 0; // Transparent
        }
    }
    ctx.putImageData(imageData, 0, 0);
}

const threshold = 0.1;
const numGauss = 50;
const gaussians = [20, 30, 40, 50, 60, 70, 80, 90, 100].map(createGaussianKernel)
const kernels = initKernels(numGauss)

drawSumOfGaussians();

window.addEventListener('resize', () => {
    canvas_width = canvas.width = window.innerWidth;
    canvas_height = canvas.height = window.innerHeight;
});