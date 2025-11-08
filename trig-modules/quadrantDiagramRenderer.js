/**
 * QuadrantDiagramRenderer - Renders unit circle diagrams with angle and quadrant highlighting
 */
class QuadrantDiagramRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.size = 300;
        this.center = this.size / 2;
        this.radius = this.size * 0.38;
        this.setupHighDPI();
    }

    setupHighDPI() {
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.size * dpr;
        this.canvas.height = this.size * dpr;
        this.canvas.style.width = `${this.size}px`;
        this.canvas.style.height = `${this.size}px`;
        this.ctx.scale(dpr, dpr);
    }

    draw(angleDeg, quadrant = null, showLabels = true) {
        this.clear();
        this.drawAxes();
        this.drawUnitCircle();
        if (showLabels) {
            this.drawQuadrantLabels();
        }

        if (angleDeg !== undefined) {
            this.drawAngle(angleDeg);
            if (quadrant) {
                this.highlightQuadrant(quadrant);
            }
        }
    }

    drawReferenceAngleDiagram(angleDeg) {
        this.clear();
        this.drawAxes();
        this.drawUnitCircle();
        // NO ASTC labels, NO angle arcs for reference angle diagram

        if (angleDeg !== undefined) {
            // Draw only the terminal ray
            this.drawTerminalRay(angleDeg);
        }
    }

    clear() {
        this.ctx.clearRect(0, 0, this.size, this.size);
    }

    drawAxes() {
        const arrowSize = 6;

        this.ctx.strokeStyle = '#d1d5db';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();

        // X-axis with arrow
        this.ctx.moveTo(10, this.center);
        this.ctx.lineTo(this.size - 10, this.center);
        this.ctx.moveTo(this.size - 10 - arrowSize, this.center - arrowSize);
        this.ctx.lineTo(this.size - 10, this.center);
        this.ctx.lineTo(this.size - 10 - arrowSize, this.center + arrowSize);

        // Y-axis with arrow
        this.ctx.moveTo(this.center, this.size - 10);
        this.ctx.lineTo(this.center, 10);
        this.ctx.moveTo(this.center - arrowSize, 10 + arrowSize);
        this.ctx.lineTo(this.center, 10);
        this.ctx.lineTo(this.center + arrowSize, 10 + arrowSize);

        this.ctx.stroke();
    }

    drawUnitCircle() {
        this.ctx.strokeStyle = '#9ca3af';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.arc(this.center, this.center, this.radius, 0, 2 * Math.PI);
        this.ctx.stroke();
    }

    drawQuadrantLabels() {
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '16px Inter, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const offset = this.center * 0.5;

        // ASTC labels
        this.ctx.fillText('A', this.center + offset, this.center - offset);
        this.ctx.fillText('S', this.center - offset, this.center - offset);
        this.ctx.fillText('T', this.center - offset, this.center + offset);
        this.ctx.fillText('C', this.center + offset, this.center + offset);
    }

    drawAngle(angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;

        // Draw angle arc
        this.ctx.fillStyle = 'rgba(79, 70, 229, 0.1)';
        this.ctx.strokeStyle = '#4f46e5';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.center, this.center);
        this.ctx.arc(this.center, this.center, this.radius * 0.4, 0, -angleRad, true);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();

        // Draw terminal arm
        const endX = this.center + this.radius * Math.cos(angleRad);
        const endY = this.center - this.radius * Math.sin(angleRad);

        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.center, this.center);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw point at end of terminal arm
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawTerminalRay(angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;

        // Draw terminal arm (ray) only - no angle arc
        const endX = this.center + this.radius * Math.cos(angleRad);
        const endY = this.center - this.radius * Math.sin(angleRad);

        this.ctx.strokeStyle = '#ef4444';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.center, this.center);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Draw point at end of terminal arm
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(endX, endY, 4, 0, 2 * Math.PI);
        this.ctx.fill();
    }

    drawReferenceAngleArc(angleDeg) {
        const angleRad = angleDeg * Math.PI / 180;
        let refAngleRad;

        // Calculate reference angle based on which quadrant the angle is in
        if (angleDeg <= 90) {
            // Q1: reference angle = angle
            refAngleRad = angleRad;
        } else if (angleDeg <= 180) {
            // Q2: reference angle = 180 - angle
            refAngleRad = (180 - angleDeg) * Math.PI / 180;
        } else if (angleDeg <= 270) {
            // Q3: reference angle = angle - 180
            refAngleRad = (angleDeg - 180) * Math.PI / 180;
        } else {
            // Q4: reference angle = 360 - angle
            refAngleRad = (360 - angleDeg) * Math.PI / 180;
        }

        // Draw reference angle arc with different style
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.15)';
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 2.5;
        this.ctx.beginPath();
        this.ctx.moveTo(this.center, this.center);

        // Draw arc based on quadrant
        if (angleDeg <= 90) {
            // Q1: arc from 0 to reference angle
            this.ctx.arc(this.center, this.center, this.radius * 0.25, 0, -refAngleRad, true);
        } else if (angleDeg <= 180) {
            // Q2: arc from 180 to angle
            this.ctx.arc(this.center, this.center, this.radius * 0.25, -Math.PI, -Math.PI + refAngleRad, false);
        } else if (angleDeg <= 270) {
            // Q3: arc from 180 to angle
            this.ctx.arc(this.center, this.center, this.radius * 0.25, -Math.PI, -Math.PI - refAngleRad, true);
        } else {
            // Q4: arc from 360/0 to angle
            this.ctx.arc(this.center, this.center, this.radius * 0.25, 0, -refAngleRad, true);
        }

        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }

    highlightQuadrant(quadrant) {
        this.ctx.fillStyle = 'rgba(251, 191, 36, 0.1)';
        this.ctx.beginPath();

        const startAngle = [0, -Math.PI/2, -Math.PI, -3*Math.PI/2][quadrant - 1];
        const endAngle = startAngle - Math.PI/2;

        this.ctx.moveTo(this.center, this.center);
        this.ctx.arc(this.center, this.center, this.radius, startAngle, endAngle, true);
        this.ctx.closePath();
        this.ctx.fill();
    }
}
