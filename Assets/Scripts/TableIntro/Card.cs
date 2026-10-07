using DG.Tweening;
using UnityEngine;

namespace BazaarBlot.TableIntro
{
    public enum Suit { Spades, Hearts, Clubs, Diamonds }
    public enum Rank { Seven, Eight, Nine, Ten, Jack, Queen, King, Ace }

    /// <summary>A single card. Needs a SpriteRenderer and a BoxCollider2D (for hover).</summary>
    [RequireComponent(typeof(SpriteRenderer), typeof(BoxCollider2D))]
    public class Card : MonoBehaviour
    {
        public Suit suit;
        public Rank rank;
        public Sprite face;
        public Sprite back;
        public float hoverLift = .25f;

        public bool FaceUp { get; private set; }
        public bool Hoverable { get; set; }

        SpriteRenderer sr;
        Vector3 restLocalPos;
        bool lifted;

        void Awake()
        {
            sr = GetComponent<SpriteRenderer>();
            ShowFace(false);
        }

        public void Init(Suit s, Rank r, Sprite faceSprite, Sprite backSprite, int order)
        {
            suit = s; rank = r; face = faceSprite; back = backSprite;
            SetOrder(order);
            ShowFace(false);
        }

        public void SetOrder(int order) => sr.sortingOrder = order;

        public void ShowFace(bool up)
        {
            FaceUp = up;
            if (sr) sr.sprite = up ? face : back;
        }

        /// <summary>Squash on X, swap the sprite at the midpoint, open back up.</summary>
        public Tween Flip(bool up, float duration = .35f)
        {
            float sx = transform.localScale.x;
            return DOTween.Sequence()
                .Append(transform.DOScaleX(0f, duration * .5f).SetEase(Ease.InQuad))
                .AppendCallback(() => ShowFace(up))
                .Append(transform.DOScaleX(sx, duration * .5f).SetEase(Ease.OutQuad));
        }

        public void SetRest() => restLocalPos = transform.localPosition;

        void OnMouseEnter()
        {
            if (!Hoverable || lifted) return;
            lifted = true;
            transform.DOLocalMove(restLocalPos + transform.localRotation * Vector3.up * hoverLift, .15f);
        }

        void OnMouseExit()
        {
            if (!lifted) return;
            lifted = false;
            transform.DOLocalMove(restLocalPos, .15f);
        }
    }
}
