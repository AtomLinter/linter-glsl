#version 110

layout(line_stripp) out;

out vec4 outColor;

void main() {
    outColor = vec4(1.0, 0.0, 0.0, 1.0);

    gl_Position = gl_in[0].gl_Position + vec4(10.0, 10.0, 0.0, 0.0);
    EmitVertex();

    gl_Position = gl_in[0].gl_Position + vec4(10.0, 20.0, 0.0, 0.0);
    EmitVertex();

    gl_Position = gl_in[0].gl_Position + vec4(20.0, 20.0, 0.0, 0.0);
    EmitVertex();

    gl_Position = gl_in[0].gl_Position + vec4(20.0, 10.0, 0.0, 0.0);
    EmitVertex();

    EndPrimitive();
}
