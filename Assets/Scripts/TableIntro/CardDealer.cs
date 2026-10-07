using System.Collections;
using System.Collections.Generic;
using DG.Tweening;
using UnityEngine;

namespace BazaarBlot.TableIntro
{
    /// <summary>
    /// Builds the 32-card Blot deck (7 to Ace), shuffles it on the table, deals in packets
    /// and fans the local player's hand.
    /// </summary>
    public class CardDealer : MonoBehaviour
    {
        [Header("Deck")]
        public Card cardPrefab;
        [Tooltip("32 face sprites in order: Spades 7..A, Hearts 7..A, Clubs 7..A, Diamonds 7..A.")]
        public Sprite[] faces = new Sprite[32];
        public Sprite back;
        [Tooltip("Where the deck sits after the dealer puts it down.")]
        public Transform deckSpot;
        public float deckThickness = .004f;

        [Header("Deal")]
        public int[] packets = { 3, 2, 3 };
        public float flightTime = .34f;
        public float betweenCards = .075f;
        public float betweenPlayers = .12f;

        [Header("Local hand")]
        public Transform handAnchor;
        public float handScale = 1.7f;
        public float handRadius = 11f;
        public float handFanDegrees = 3.3f;

        [Header("Sound")]
        public AudioSource sfx;
        public AudioClip[] flicks;

        readonly List<Card> deck = new List<Card>();

        public void BuildDeck(Vector3 from, Quaternion rotation)
        {
            foreach (var c in deck) if (c) Destroy(c.gameObject);
            deck.Clear();
            for (int i = 0; i < 32; i++)
            {
                var card = Instantiate(cardPrefab, from, rotation, transform);
                card.Init((Suit)(i / 8), (Rank)(i % 8), faces[i], back, i);
                deck.Add(card);
            }
            for (int i = deck.Count - 1; i > 0; i--)
            {
                int j = Random.Range(0, i + 1);
                (deck[i], deck[j]) = (deck[j], deck[i]);
            }
        }

        /// <summary>Slides the deck from the dealer's hands to the table.</summary>
        public IEnumerator PlaceDeck()
        {
            for (int i = 0; i < deck.Count; i++)
            {
                deck[i].SetOrder(i);
                deck[i].transform.DOMove(StackPos(i), .6f).SetEase(Ease.InOutCubic).SetDelay(.2f);
                deck[i].transform.DORotateQuaternion(deckSpot.rotation, .6f).SetDelay(.2f);
            }
            yield return new WaitForSeconds(.85f);
            Flick(1f);
        }

        /// <summary>Two riffle shuffles: split into halves, interleave back.</summary>
        public IEnumerator Shuffle(int times = 2)
        {
            for (int rep = 0; rep < times; rep++)
            {
                int half = deck.Count / 2;
                for (int i = 0; i < deck.Count; i++)
                {
                    bool left = i < half;
                    var offset = deckSpot.right * (left ? -.6f : .6f);
                    deck[i].transform.DOMove(StackPos(i) + offset, .28f).SetEase(Ease.InOutCubic);
                    deck[i].transform.DORotateQuaternion(deckSpot.rotation * Quaternion.Euler(0, 0, left ? 6 : -6), .28f);
                }
                yield return new WaitForSeconds(.3f);

                var mixed = new List<Card>(deck.Count);
                for (int i = 0; i < half; i++)
                {
                    bool leftFirst = Random.value < .5f;
                    mixed.Add(leftFirst ? deck[i] : deck[half + i]);
                    mixed.Add(leftFirst ? deck[half + i] : deck[i]);
                }
                deck.Clear(); deck.AddRange(mixed);

                for (int k = 0; k < deck.Count; k++)
                {
                    var c = deck[k];
                    c.SetOrder(k);
                    c.transform.DOMove(StackPos(k), .16f).SetDelay(k * .018f);
                    c.transform.DORotateQuaternion(deckSpot.rotation, .16f).SetDelay(k * .018f);
                    if (k % 3 == 0) DOVirtual.DelayedCall(k * .018f + .16f, () => Flick(.5f));
                }
                yield return new WaitForSeconds(deck.Count * .018f + .35f);
            }
        }

        /// <summary>Deals packets (3-2-3) to seats in the given order. Returns each seat's cards.</summary>
        public IEnumerator Deal(IList<SeatController> order, Dictionary<SeatController, List<Card>> hands)
        {
            foreach (var s in order) hands[s] = new List<Card>();
            int perPlayer = 0;
            foreach (var p in packets) perPlayer += p;
            int sorting = 100;

            foreach (var packet in packets)
            {
                foreach (var seat in order)
                {
                    for (int k = 0; k < packet && deck.Count > 0; k++)
                    {
                        var card = deck[deck.Count - 1];
                        deck.RemoveAt(deck.Count - 1);
                        var list = hands[seat];
                        seat.PileSlot(list.Count, perPlayer, out var pos, out var rot);
                        list.Add(card);
                        card.SetOrder(sorting++);
                        card.transform.DOMove(pos, flightTime).SetEase(Ease.OutCubic);
                        card.transform.DORotateQuaternion(rot, flightTime).SetEase(Ease.OutCubic);
                        Flick(1f);
                        yield return new WaitForSeconds(betweenCards);
                    }
                    yield return new WaitForSeconds(betweenPlayers);
                }
                yield return new WaitForSeconds(.25f);
            }
        }

        /// <summary>Moves the local player's cards into a sorted fan at the bottom and flips them.</summary>
        public IEnumerator PickUpHand(List<Card> cards)
        {
            cards.Sort((a, b) => a.suit != b.suit ? a.suit.CompareTo(b.suit) : a.rank.CompareTo(b.rank));
            int n = cards.Count;
            for (int i = 0; i < n; i++)
            {
                var c = cards[i];
                float angle = (i - (n - 1) * .5f) * handFanDegrees;
                var dir = Quaternion.Euler(0, 0, -angle) * Vector3.up;
                var pos = handAnchor.position + dir * handRadius - Vector3.up * handRadius;
                c.SetOrder(300 + i);
                c.transform.SetParent(handAnchor, true);
                c.transform.DOMove(pos, .5f).SetEase(Ease.InOutCubic).SetDelay(i * .04f);
                c.transform.DORotateQuaternion(Quaternion.Euler(0, 0, -angle), .5f).SetDelay(i * .04f);
                c.transform.DOScale(handScale, .5f).SetDelay(i * .04f)
                    .OnComplete(() => c.Flip(true).OnComplete(() => { c.SetRest(); c.Hoverable = true; Flick(.4f); }));
            }
            yield return new WaitForSeconds(.5f + n * .04f + .4f);
        }

        Vector3 StackPos(int i) => deckSpot.position + deckSpot.up * (i * deckThickness);

        void Flick(float volume)
        {
            if (!sfx || flicks == null || flicks.Length == 0) return;
            sfx.pitch = Random.Range(.92f, 1.08f);
            sfx.PlayOneShot(flicks[Random.Range(0, flicks.Length)], volume);
        }
    }
}
