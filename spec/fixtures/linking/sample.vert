#version 110
void not_main() {
  gl_Position = gl_ModelViewProjectionMatrix * gl_Vertex;
}
