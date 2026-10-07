using System.Collections;
using DG.Tweening;
using TMPro;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace BazaarBlot.TableIntro
{
    /// <summary>
    /// One chair at the table: the character, its light, nameplate, speech bubble and card pile.
    /// The director calls <see cref="Join"/> when the player actually connects.
    /// </summary>
    public class SeatController : MonoBehaviour
    {
        [Header("Player")]
        public string playerName = "Дон Марко";
        public int rating = 2310;
        [TextArea] public string greeting = "Добро пожаловать за мой стол";

        [Header("Character")]
        public Animator animator;
        public SpriteRenderer[] characterRenderers;
        public IdleActionPicker idleActions;
        public ParticleSystem appearSparkles;

        [Header("Light")]
        public Light2D seatLight;
        public float litIntensity = 1.2f;

        [Header("UI")]
        public CanvasGroup nameplate;
        public TMP_Text nameplateStatus;
        public GameObject dealerBadge;
        public CanvasGroup bubble;
        public TMP_Text bubbleText;

        [Header("Cards")]
        [Tooltip("Centre of this player's face-down pile. Its right axis is the direction the pile fans out.")]
        public Transform pileAnchor;
        public float pileSpacing = 0.15f;
        public float pileFanDegrees = 1.7f;

        static readonly int AppearHash = Animator.StringToHash("Appear");
        static readonly int GreetHash = Animator.StringToHash("Greet");

        void Awake() => ResetSeat();

        public void ResetSeat()
        {
            if (seatLight) seatLight.intensity = 0f;
            foreach (var r in characterRenderers) SetAlpha(r, 0f);
            if (nameplate) nameplate.alpha = 0f;
            if (bubble) bubble.alpha = 0f;
            if (dealerBadge) dealerBadge.SetActive(false);
            if (idleActions) idleActions.enabled = false;
        }

        public IEnumerator Join()
        {
            nameplate.DOFade(1f, .35f);
            nameplateStatus.text = "подключается…";
            yield return new WaitForSeconds(.55f);

            nameplateStatus.text = "★ " + rating.ToString("N0");
            DOTween.To(() => seatLight.intensity, v => seatLight.intensity = v, litIntensity, .7f);
            foreach (var r in characterRenderers) r.DOFade(1f, .5f);
            if (appearSparkles) appearSparkles.Play();
            animator.SetTrigger(AppearHash);
            yield return new WaitForSeconds(.45f);

            bubbleText.text = greeting;
            bubble.DOFade(1f, .25f);
            bubble.transform.localScale = Vector3.one * .6f;
            bubble.transform.DOScale(1f, .35f).SetEase(Ease.OutBack);
            animator.SetTrigger(GreetHash);
            yield return new WaitForSeconds(2.2f);

            bubble.DOFade(0f, .3f);
            if (idleActions) idleActions.enabled = true;
        }

        public void SetDealer(bool on)
        {
            if (!dealerBadge) return;
            dealerBadge.SetActive(on);
            if (on) dealerBadge.transform.DOPunchScale(Vector3.one * .3f, .4f);
        }

        public void PileSlot(int index, int count, out Vector3 position, out Quaternion rotation)
        {
            float k = index - (count - 1) * .5f;
            position = pileAnchor.position + pileAnchor.right * (k * pileSpacing);
            rotation = pileAnchor.rotation * Quaternion.Euler(0, 0, k * pileFanDegrees);
        }

        static void SetAlpha(SpriteRenderer r, float a)
        {
            var c = r.color; c.a = a; r.color = c;
        }
    }
}
