using DG.Tweening;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace BazaarBlot.TableIntro
{
    /// <summary>
    /// Ember glow and smoke for Don Marco's cigar. Put it on the cigar tip (child of the hand bone)
    /// and call the methods from Animation Events in the "Puff" clip.
    /// </summary>
    public class CigarFX : MonoBehaviour
    {
        public Light2D ember;
        public float emberIdle = .35f;
        public float emberPuff = 1.6f;
        [Tooltip("Thin constant smoke from the tip.")]
        public ParticleSystem tipSmoke;
        [Tooltip("Burst emitted from the mouth on exhale. Place it at the mouth, not on the cigar.")]
        public ParticleSystem exhaleSmoke;
        public int exhaleParticles = 12;

        void Start()
        {
            if (ember) ember.intensity = emberIdle;
            if (tipSmoke) tipSmoke.Play();
        }

        void Update()
        {
            if (ember && !DOTween.IsTweening(ember))
                ember.intensity = emberIdle + Mathf.PerlinNoise(Time.time * 3f, 0f) * .15f;
        }

        // Animation Event: when the cigar reaches the lips.
        public void Inhale()
        {
            DOTween.Kill(ember);
            DOTween.To(() => ember.intensity, v => ember.intensity = v, emberPuff, .3f).SetTarget(ember);
        }

        // Animation Event: when the hand starts moving away.
        public void Exhale()
        {
            DOTween.Kill(ember);
            DOTween.To(() => ember.intensity, v => ember.intensity = v, emberIdle, 1.2f).SetTarget(ember);
            if (exhaleSmoke) exhaleSmoke.Emit(exhaleParticles);
        }
    }
}
