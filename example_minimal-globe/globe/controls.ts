import { degToRad, fmod, clamp, clamp01, log2 } from './mathUtils';

export class GlobeControls {
    private canvas: HTMLCanvasElement;
    public userYaw: number;
    public userPitch: number;
    public userZoom: number;

    public spaceDown: boolean;
    public spaceClick: boolean;

    private isDragging: boolean;
    private prevX: number;
    private prevY: number;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.userYaw = 0.0;
        this.userPitch = 0.0;
        this.userZoom = 2.0;

        this.spaceDown = false;
        this.spaceClick = false;

        this.isDragging = false;
        this.prevX = 0;
        this.prevY = 0;

        this.attachEventListeners();
    }

    public tickReset() {
        this.spaceClick = false;
    }

    private attachEventListeners() {
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleScroll(e));
        document.addEventListener('keydown', (e) => this.handleKeyboard(e, 'down'));
        document.addEventListener('keyup', (e) => this.handleKeyboard(e, 'up'));
    }

    private handleKeyboard(e: KeyboardEvent, action: 'down' | 'up') {
        if (e.code === 'Space') {

            if (action == 'down') {
                //prevent repeated keys
                if (this.spaceDown == false) {
                    this.spaceClick = true;
                }
                this.spaceDown = true
            } else {
                this.spaceDown = false
            }
        }
    }

    private handleScroll(e: WheelEvent) {
        const scrollSpeed = 0.001;
        const zoomIntensity = e.deltaY * scrollSpeed;
        const exponentialFactor = 1.5;
        let newZoom = this.userZoom * Math.pow(zoomIntensity + 1.0, exponentialFactor);
        newZoom = clamp(newZoom, 0.0, 400000.0);

        //move mouse to zoom direction
        // let mouseX = e.pageX - this.userYaw
        // let mouseY = e.pageY - this.userPitch
        // mouseX = mouseX * -1.0
        // mouseY = mouseY * -1.0
        // this.userYaw = (mouseX * newZoom / this.userZoom) + this.userYaw - mouseX;
        // this.userPitch = (mouseY * newZoom / this.userZoom) + this.userPitch - mouseY;
        this.userZoom = newZoom;
    }

    private handleMouseDown(e: MouseEvent) {
        this.isDragging = true;
        this.prevX = e.pageX;
        this.prevY = e.pageY;
    }

    private handleMouseMove(e: MouseEvent) {
        if (this.isDragging) {
            const deltaX = e.pageX - this.prevX;
            const deltaY = e.pageY - this.prevY;

            const spinScale = 0.5;
            this.userYaw += deltaX * (this.userZoom * spinScale);
            this.userPitch += deltaY * (this.userZoom * spinScale);

            this.prevX = e.pageX;
            this.prevY = e.pageY;
        }
    }

    private handleMouseUp(e: MouseEvent) {
        if (this.isDragging) {
            this.isDragging = false;
        }
    }
}
