import { MapQuadTreeNode } from './quadTree';
import { GlobeControls } from './controls';
import { vec3, mat4 } from "gl-matrix";
import { degToRad } from './mathUtils';

class SquareMesh {
    gl: WebGL2RenderingContext;
    vertices: Float32Array;
    public textureLoaded: boolean = false;
    #textureID: WebGLTexture | null = null;
    #anistropicExtensions: EXT_texture_filter_anisotropic | null;
    #positionBuffer: WebGLBuffer | null = null;

    constructor(gl: WebGL2RenderingContext, textureURL: string, corners: vec3[]) {
        this.gl = gl;
        this.vertices = new Float32Array([
            ...corners[0], ...corners[1], ...corners[2], // first triangle
            ...corners[2], ...corners[1], ...corners[3],  // second triangle
            ...corners[4], ...corners[5], ...corners[6],
            ...corners[6], ...corners[5], ...corners[7],
            ...corners[8], ...corners[9], ...corners[10],
            ...corners[10], ...corners[9], ...corners[11],
            ...corners[12], ...corners[13], ...corners[14],
            ...corners[14], ...corners[13], ...corners[15]
        ]);
        this.#setupBuffers();
        this.#anistropicExtensions = this.gl.getExtension('EXT_texture_filter_anisotropic') || this.gl.getExtension('WEBKIT_EXT_texture_filter_anisotropic') || this.gl.getExtension('MOZ_EXT_texture_filter_anisotropic');
        this.#setupTexture(textureURL);
    }

    delete() {
        if (this.#positionBuffer) {
            this.gl.deleteBuffer(this.#positionBuffer);
            this.#positionBuffer = null;
        }

        if (this.#textureID) {
            this.gl.deleteTexture(this.#textureID);
            this.#textureID = null;
        }
    }

    bind() {
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);
        //disable filtering because elecation sampling is in custom encoding and does not support that
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
    }

    #setupBuffers() {
        this.#positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.#positionBuffer);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.vertices, this.gl.STATIC_DRAW);
    }

    // decodeRGBToElevation(rgbImage: ImageData): ImageData {
    //     const data = rgbImage.data;
    //     const outputData = new Uint8ClampedArray(data.length);
    //     for (let i = 0; i < data.length; i += 4) {
    //         const R = data[i + 4];//wrong
    //         const G = data[i + 3];
    //         const B = data[i + 2];
    //         const elevation = -10000 + ((R * 256 * 256 + G * 256 + B) * 0.1);

    //         var newColor = elevation / 1000;
    //         newColor = Math.max(0, Math.min(255, newColor))
    //         outputData[i + 0] = newColor;   // Red
    //         outputData[i + 1] = 0;   // Green
    //         outputData[i + 2] = 0;   // Blue
    //         outputData[i + 3] = 255;        // Alpha
    //     }
    //     return new ImageData(outputData, rgbImage.width, rgbImage.height);
    // }

    #setupTexture(textureURL: string) {
        this.#textureID = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);
        const image = new Image();
        image.src = textureURL;
        image.crossOrigin = 'anonymous';
        image.onload = () => {
            // const canvas = document.createElement('canvas');
            // const ctx = canvas.getContext('2d');
            // if (ctx == null)
            //     return;
            // canvas.width = image.width;
            // canvas.height = image.height;
            // ctx.drawImage(image, 0, 0);
            // const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            // const processedImageData = this.decodeRGBToElevation(imageData);
            // ctx.putImageData(processedImageData, 0, 0);


            this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);

            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            
            const level = 0;
            const internalFormat = this.gl.RGBA;
            const border = 0;
            const format = this.gl.RGBA;
            const type = this.gl.UNSIGNED_BYTE;
            // this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, format, type, canvas);
            this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, format, type, image);

            this.#setupTextureFilteringAndMipmaps(image.width, image.height);
            this.textureLoaded = true
        };

        image.onerror = () => {
            const blackPixel = new Uint8Array([0, 0, 0, 255]);
            this.gl.bindTexture(this.gl.TEXTURE_2D, this.#textureID);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, this.gl.RGBA, this.gl.UNSIGNED_BYTE, blackPixel);
            this.textureLoaded = true;
        };
    }

    #setupTextureFilteringAndMipmaps(textureWidth: number, textureHeight: number) {
        const isPowerOfTwo = (x: number): boolean => (x & (x - 1)) === 0;

        if (isPowerOfTwo(textureWidth) && isPowerOfTwo(textureHeight)) {
            this.gl.generateMipmap(this.gl.TEXTURE_2D);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
        } else {
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        }
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

        if (this.#anistropicExtensions) {
            const max = this.gl.getParameter(this.#anistropicExtensions.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
            this.gl.texParameterf(this.gl.TEXTURE_2D, this.#anistropicExtensions.TEXTURE_MAX_ANISOTROPY_EXT, max);
        }
    }
}

export class Renderer {
    canvas: HTMLCanvasElement | null = null;
    gl: WebGL2RenderingContext | null = null;
    controls: GlobeControls;
    rootNode: any;
    #shaderProgram: WebGLProgram | null = null;
    #positionLocation: number | undefined;
    #texcoordLocation: number | undefined;
    #texcoordBuffer: WebGLBuffer | null = null;
    #startTimeMs: number;
    drawArraysAsLines: Boolean = false;

    #frameModelMatrix: mat4 | undefined;
    #frameViewMatrix: mat4 | undefined;
    #frameProjectionMatrix: mat4 | undefined;

    constructor(canvas: HTMLCanvasElement | null, controls: GlobeControls) {
        this.canvas = canvas;
        this.controls = controls;
        this.gl = this.canvas ? this.canvas.getContext('webgl2', { antialias: true }) : null;

        this.drawScene = this.drawScene.bind(this);
        this.#startTimeMs = Date.now();

        if (!this.gl) {
            console.error('WebGL not supported');
            throw 'WebGL not supported';
        }
        this.#resizeCanvasToDisplaySize();

        this.rootNode = new MapQuadTreeNode(this);
    }

    addMapTile(textureURL: string, corners: vec3[]) {
        return new SquareMesh(this.gl!, textureURL, corners);
    }

    async initRenderer() {
        this.#shaderProgram = await this.#initShaderProgram();
        this.#positionLocation = this.gl!.getAttribLocation(this.#shaderProgram!, "aVertexPosition");
        this.#texcoordLocation = this.gl!.getAttribLocation(this.#shaderProgram!, "aTextureCoord");

        this.#texcoordBuffer = this.gl!.createBuffer();
        this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, this.#texcoordBuffer!);
        this.gl!.bufferData(this.gl!.ARRAY_BUFFER, new Float32Array([
            0.0, 0.5,
            0.5, 0.5,
            0.0, 0.0,
            0.0, 0.0,
            0.5, 0.5,
            0.5, 0.0,

            0.5, 0.5,
            1.0, 0.5,
            0.5, 0.0,
            0.5, 0.0,
            1.0, 0.5,
            1.0, 0.0,

            0.0, 1.0,
            0.5, 1.0,
            0.0, 0.5,
            0.0, 0.5,
            0.5, 1.0,
            0.5, 0.5,

            0.5, 1.0,
            1.0, 1.0,
            0.5, 0.5,
            0.5, 0.5,
            1.0, 1.0,
            1.0, 0.5
        ]), this.gl!.STATIC_DRAW);
    }

    #resizeCanvasToDisplaySize() {
        const width = this.canvas!.clientWidth * window.devicePixelRatio;
        const height = this.canvas!.clientHeight * window.devicePixelRatio;

        if (this.canvas!.width !== width || this.canvas!.height !== height) {
            this.canvas!.width = width;
            this.canvas!.height = height;
            this.gl!.viewport(0, 0, this.canvas!.width, this.canvas!.height);
        }
    }

    async #fileToString(filename: string) {
        try {
            const response = await fetch(filename);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.text();
        } catch (error) {
            console.error('There was a problem with the fetch operation:', error);
            throw error;
        }
    }

    #compileShader(source: string, type: GLenum) {
        const shader = this.gl!.createShader(type)!;
        this.gl!.shaderSource(shader, source);
        this.gl!.compileShader(shader);
        if (!this.gl!.getShaderParameter(shader, this.gl!.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + this.gl!.getShaderInfoLog(shader));
            this.gl!.deleteShader(shader);
            return null;
        }
        return shader;
    }

    async #initShaderProgram() {
        let urlstr: string = window.location.href;
        if (urlstr.endsWith('index.html')) {
            urlstr = urlstr.substring(0, urlstr.length - 'index.html'.length);
        }
        const vsSource = await this.#fileToString(urlstr + 'globe/texture_vertex.glsl');
        const fsSource = await this.#fileToString(urlstr + 'globe/texture_frag.glsl');

        const vertexShader = this.#compileShader(vsSource, this.gl!.VERTEX_SHADER)!;
        const fragmentShader = this.#compileShader(fsSource, this.gl!.FRAGMENT_SHADER)!;
        const shaderProgram = this.gl!.createProgram()!;
        this.gl!.attachShader(shaderProgram, vertexShader);
        this.gl!.attachShader(shaderProgram, fragmentShader);
        this.gl!.linkProgram(shaderProgram);
        if (!this.gl!.getProgramParameter(shaderProgram, this.gl!.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + this.gl!.getProgramInfoLog(shaderProgram));
            return null;
        }
        return shaderProgram;
    }

    drawSquareMesh(square: any) {
        this.gl!.useProgram(this.#shaderProgram);

        this.gl!.enableVertexAttribArray(this.#positionLocation!);
        square.bind();
        this.gl!.vertexAttribPointer(this.#positionLocation!, 3, this.gl!.FLOAT, false, 0, 0);

        this.gl!.enableVertexAttribArray(this.#texcoordLocation!);
        this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, this.#texcoordBuffer!);
        this.gl!.vertexAttribPointer(this.#texcoordLocation!, 2, this.gl!.FLOAT, false, 0, 0);

        this.gl!.uniformMatrix4fv(
            this.gl!.getUniformLocation(this.#shaderProgram!, 'uModelMatrix'),
            false,
            this.#frameModelMatrix!
        );

        this.gl!.uniformMatrix4fv(
            this.gl!.getUniformLocation(this.#shaderProgram!, 'uViewMatrix'),
            false,
            this.#frameViewMatrix!
        );

        this.gl!.uniformMatrix4fv(
            this.gl!.getUniformLocation(this.#shaderProgram!, 'uProjectionMatrix'),
            false,
            this.#frameProjectionMatrix!
        );

        if (this.drawArraysAsLines) {
            //debug lines
            this.gl!.drawArrays(this.gl!.LINE_LOOP, 0, 6 * 4);
        } else {
            this.gl!.drawArrays(this.gl!.TRIANGLES, 0, 6 * 4);
        }
    }

    tick() {
        this.rootNode.update();
    }

    drawScene() {
        this.#resizeCanvasToDisplaySize();

        this.gl!.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl!.clear(this.gl!.COLOR_BUFFER_BIT | this.gl!.DEPTH_BUFFER_BIT);
        this.gl!.enable(this.gl!.DEPTH_TEST);

        this.#frameModelMatrix = mat4.create();
        // let dtSec = (Date.now() - this.#startTimeMs) / 1000
        // let spinDurationSec = 40
        // let progress = fmod(dtSec, spinDurationSec) / spinDurationSec
        // let rotYRad = degToRad(360 * progress);
        // mat4.rotate(this.#frameModelMatrix, this.#frameModelMatrix, rotYRad, [0, 1, 0]);

        if (this.controls.spaceClick) {
            this.drawArraysAsLines = !this.drawArraysAsLines
        }
        mat4.rotate(this.#frameModelMatrix, this.#frameModelMatrix, this.controls.userPitch / 500, [1, 0, 0]);
        mat4.rotate(this.#frameModelMatrix, this.#frameModelMatrix, this.controls.userYaw / 500, [0, 1, 0]);

        this.#frameViewMatrix = mat4.create();

        let earthRad = 6378137.0; //m

        //should be 1 but i guess the ECEF earth is not sphere so it dont work
        //TODO get wgs rad at that pos
        //or raycast from center to cam pos
        let nearestRad = 0.99;
        const translation = vec3.fromValues(0, 0, -1 * (this.controls.userZoom + nearestRad) * earthRad);
        mat4.translate(this.#frameViewMatrix, this.#frameViewMatrix, translation);


        this.#frameProjectionMatrix = mat4.create();
        const fovy = degToRad(50)
        const aspect = this.canvas!.clientWidth / this.canvas!.clientHeight;
        const near = 500;
        const far = earthRad * 10;
        mat4.perspective(this.#frameProjectionMatrix, fovy, aspect, near, far);


        const mvpMatrix = mat4.create();
        mat4.multiply(mvpMatrix, this.#frameProjectionMatrix, this.#frameViewMatrix);
        mat4.multiply(mvpMatrix, mvpMatrix, this.#frameModelMatrix);
        this.rootNode.renderQuadTree(mvpMatrix);
    }
}
