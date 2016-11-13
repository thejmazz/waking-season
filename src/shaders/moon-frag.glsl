// simplex, son
#pragma glslify: snoise3 = require(glsl-noise/simplex/3d)
#pragma glslify: snoise4 = require(glsl-noise/simplex/4d)
#pragma glslify: snoise2 = require(glsl-noise/simplex/2d)

uniform float frequency;
uniform int octaves;
uniform float amplitude;
uniform float lacunarity;
uniform float gain;
uniform float timeFactor;

// we gonna hijack diffuse
uniform vec3 diffuse;
uniform vec3 emissive;
/* uniform float opacity; */

// add time for noise
uniform float time;
// and take xyz pos from vertex shader
varying vec3 pos;

varying vec3 vLightFront;

#ifdef DOUBLE_SIDED
	varying vec3 vLightBack;
#endif

#include <common>
#include <packing>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <uv2_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_pars_fragment>
#include <bsdfs>
#include <lights_pars>
#include <fog_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

float fbm (vec3 pos, float time, float frequency, float amplitude, float lacunarity, float gain) {
    float total = 0.0;
    /* int octaves = 5; */

    for (int i = 0; i < 100; i++) {
        float noise = snoise4(vec4(pos * frequency, time));
        total += noise;

        frequency *= lacunarity;
        amplitude *= gain;

        if (i == octaves - 1 ) {
            break;
        }
    }

    return total;
}

void main() {
    /* float frequency = 0.5; */
    /* float amplitude = 4.0; */
    /* float lacunarity = 2.0; */
    /* float gain = 0.5; */

    /* float opacity = fbm(pos, time * 0.01, frequency, amplitude, lacunarity, gain); */
    float opacity = fbm(pos, time * timeFactor, frequency, amplitude, lacunarity, gain);
    opacity *= 0.8;

    // see bottom to where gl_FragColor is set, using either diffuse or lighted
    // color

    // === lambert shader code ===

    #include <clipping_planes_fragment>

    vec4 diffuseColor = vec4( diffuse, opacity );
    ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
    vec3 totalEmissiveRadiance = emissive;

    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <specularmap_fragment>
    #include <emissivemap_fragment>

    reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );

    #include <lightmap_fragment>

    reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );

    #ifdef DOUBLE_SIDED
            reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;
    #else
            reflectedLight.directDiffuse = vLightFront;
    #endif

    reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();

    #include <aomap_fragment>

    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;

    #include <normal_flip>
    #include <envmap_fragment>

    /* gl_FragColor = vec4( outgoingLight, diffuseColor.a ); */
    gl_FragColor = vec4( diffuse, opacity );
    /* gl_FragColor = vec4( outgoingLight, opacity ); */

    #include <premultiplied_alpha_fragment>
    #include <tonemapping_fragment>
    #include <encodings_fragment>
    #include <fog_fragment>
}

