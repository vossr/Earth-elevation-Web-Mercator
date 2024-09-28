precision mediump float;
varying highp vec2 vTextureCoord;
uniform highp sampler2D uSampler;

vec3 magma(float t) {
    const vec3 c1 = vec3(0.001462, 0.000466, 0.013866);
    const vec3 c2 = vec3(0.037668, 0.025921, 0.132232);
    const vec3 c3 = vec3(0.116656, 0.047574, 0.272321);
    const vec3 c4 = vec3(0.217949, 0.036615, 0.383522);
    const vec3 c5 = vec3(0.316282, 0.053490, 0.425116);
    const vec3 c6 = vec3(0.410113, 0.087896, 0.433098);
    const vec3 c7 = vec3(0.503493, 0.121575, 0.423356);
    const vec3 c8 = vec3(0.596940, 0.154848, 0.398125);
    const vec3 c9 = vec3(0.688653, 0.192239, 0.357603);
    const vec3 c10 = vec3(0.759257, 0.231214, 0.305324);
    const vec3 c11 = vec3(0.812014, 0.276022, 0.237119);
    const vec3 c12 = vec3(0.847600, 0.326902, 0.163325);
    const vec3 c13 = vec3(0.870701, 0.384989, 0.099702);
    const vec3 c14 = vec3(0.884720, 0.450001, 0.043348);
    const vec3 c15 = vec3(0.889868, 0.522850, 0.029950);
    const vec3 c16 = vec3(0.886276, 0.601827, 0.141924);
    const vec3 c17 = vec3(0.878168, 0.679998, 0.282327);
    const vec3 c18 = vec3(0.859423, 0.759774, 0.420211);
    const vec3 c19 = vec3(0.827593, 0.841727, 0.551338);
    const vec3 c20 = vec3(0.774478, 0.925937, 0.672376);
    const vec3 c21 = vec3(0.677005, 0.981928, 0.745636);

    if (t < 0.05) return mix(c1, c2, (t - 0.0) / 0.05);
    else if (t < 0.10) return mix(c2, c3, (t - 0.05) / 0.05);
    else if (t < 0.15) return mix(c3, c4, (t - 0.10) / 0.05);
    else if (t < 0.20) return mix(c4, c5, (t - 0.15) / 0.05);
    else if (t < 0.25) return mix(c5, c6, (t - 0.20) / 0.05);
    else if (t < 0.30) return mix(c6, c7, (t - 0.25) / 0.05);
    else if (t < 0.35) return mix(c7, c8, (t - 0.30) / 0.05);
    else if (t < 0.40) return mix(c8, c9, (t - 0.35) / 0.05);
    else if (t < 0.45) return mix(c9, c10, (t - 0.40) / 0.05);
    else if (t < 0.50) return mix(c10, c11, (t - 0.45) / 0.05);
    else if (t < 0.55) return mix(c11, c12, (t - 0.50) / 0.05);
    else if (t < 0.60) return mix(c12, c13, (t - 0.55) / 0.05);
    else if (t < 0.65) return mix(c13, c14, (t - 0.60) / 0.05);
    else if (t < 0.70) return mix(c14, c15, (t - 0.65) / 0.05);
    else if (t < 0.75) return mix(c15, c16, (t - 0.70) / 0.05);
    else if (t < 0.80) return mix(c16, c17, (t - 0.75) / 0.05);
    else if (t < 0.85) return mix(c17, c18, (t - 0.80) / 0.05);
    else if (t < 0.90) return mix(c18, c19, (t - 0.85) / 0.05);
    else if (t < 0.95) return mix(c19, c20, (t - 0.90) / 0.05);
    else return mix(c20, c21, (t - 0.95) / 0.05);
}

void main(void) {
    vec4 col = texture2D(uSampler, vTextureCoord);
    const float offset = -10000.0;
    const float scaleFactor = 0.1;
    float elevation = offset + ((col.r * 256.0 * 256.0 * 256.0 + col.g * 256.0 * 256.0 + col.b * 256.0 ) * scaleFactor);
    elevation = elevation / 4000.0;
    if (elevation > 1.0) {
        elevation = 1.0;
    }
    gl_FragColor = vec4(magma(elevation), 1.0);
}
