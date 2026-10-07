using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace BazaarBlot.TableIntro
{
    /// <summary>Fireplace flicker: Perlin noise on a Light2D's intensity and radius.</summary>
    [RequireComponent(typeof(Light2D))]
    public class LightFlicker : MonoBehaviour
    {
        public float baseIntensity = 1f;
        public float intensityJitter = .35f;
        public float radiusJitter = .08f;
        public float speed = 6f;

        Light2D light2D;
        float baseRadius, seed;

        void Awake()
        {
            light2D = GetComponent<Light2D>();
            baseRadius = light2D.pointLightOuterRadius;
            seed = Random.value * 100f;
        }

        void Update()
        {
            float t = Time.time * speed;
            float n = Mathf.PerlinNoise(seed, t) * .7f + Mathf.PerlinNoise(seed + 7f, t * 3.1f) * .3f;
            light2D.intensity = baseIntensity + (n - .5f) * 2f * intensityJitter;
            light2D.pointLightOuterRadius = baseRadius * (1f + (n - .5f) * 2f * radiusJitter);
        }
    }
}
