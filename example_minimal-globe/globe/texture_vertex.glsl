attribute highp vec4 aVertexPosition; 
attribute highp vec2 aTextureCoord;
uniform highp mat4 uModelMatrix;
uniform highp mat4 uViewMatrix;
uniform highp mat4 uProjectionMatrix;

varying highp vec2 vTextureCoord;
void main(void) {
    highp vec4 worldSpacePosition = uModelMatrix * aVertexPosition;
    
    //TODO: could project to any map projection

    gl_Position = uProjectionMatrix * uViewMatrix * worldSpacePosition;
    vTextureCoord = aTextureCoord;
}
