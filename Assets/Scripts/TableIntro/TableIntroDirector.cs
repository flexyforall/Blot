using System.Collections;
using System.Collections.Generic;
using DG.Tweening;
using TMPro;
using UnityEngine;
using UnityEngine.Rendering.Universal;

namespace BazaarBlot.TableIntro
{
    /// <summary>
    /// Runs the "table opens" scene: room fades in, players join one by one (light comes on, they
    /// greet), room lights up, the dealer shuffles and deals 3-2-3, the local hand is picked up.
    ///
    /// Demo mode joins everyone on a timer. In the real game turn <see cref="demoJoin"/> off and
    /// call <see cref="PlayerJoined"/> from the network code when a player connects.
    /// </summary>
    public class TableIntroDirector : MonoBehaviour
    {
        [Header("Seats")]
        public SeatController localSeat;
        [Tooltip("Order in which players join in demo mode.")]
        public SeatController[] joinOrder;
        public SeatController dealer;
        [Tooltip("Counter-clockwise from the dealer: the player on the dealer's right first.")]
        public SeatController[] dealOrder;

        [Header("Room")]
        public Light2D globalLight;
        public float darkIntensity = .25f;
        public float litIntensity = .9f;
        public CanvasGroup blackScreen;

        [Header("Cards")]
        public CardDealer cardDealer;
        [Tooltip("Where the deck appears: the dealer's hands.")]
        public Transform deckOrigin;

        [Header("UI")]
        public TMP_Text phaseLabel;
        public CanvasGroup scorePanel;
        public CanvasGroup nextStagePanel;

        [Header("Demo")]
        public bool demoJoin = true;
        public float demoJoinInterval = 1.55f;

        readonly HashSet<SeatController> seated = new HashSet<SeatController>();
        readonly Dictionary<SeatController, List<Card>> hands = new Dictionary<SeatController, List<Card>>();

        void Start() => StartCoroutine(Play());

        /// <summary>Call from network code when a player actually connects.</summary>
        public void PlayerJoined(SeatController seat)
        {
            if (seated.Add(seat)) StartCoroutine(seat.Join());
        }

        IEnumerator Play()
        {
            globalLight.intensity = darkIntensity;
            scorePanel.alpha = 0f;
            nextStagePanel.alpha = 0f;
            blackScreen.alpha = 1f;
            Phase("Подключение к столу…");
            blackScreen.DOFade(0f, 1.2f);
            yield return new WaitForSeconds(.8f);

            PlayerJoined(localSeat);
            if (demoJoin)
            {
                foreach (var seat in joinOrder)
                {
                    PlayerJoined(seat);
                    Phase($"Ожидание игроков · {seated.Count}/4");
                    yield return new WaitForSeconds(demoJoinInterval);
                }
            }
            while (seated.Count < 4)
            {
                Phase($"Ожидание игроков · {seated.Count}/4");
                yield return null;
            }
            yield return new WaitForSeconds(2.2f);   // let the last greeting finish

            Phase("Все за столом");
            DOTween.To(() => globalLight.intensity, v => globalLight.intensity = v, litIntensity, 1.4f);
            scorePanel.DOFade(1f, .6f);
            yield return new WaitForSeconds(.9f);

            dealer.SetDealer(true);
            Phase($"Сдаёт {dealer.playerName}");
            cardDealer.BuildDeck(deckOrigin.position, deckOrigin.rotation);
            yield return cardDealer.PlaceDeck();

            Phase("Тасовка");
            yield return cardDealer.Shuffle(2);

            Phase("Раздача · 3 · 2 · 3");
            yield return cardDealer.Deal(dealOrder, hands);
            yield return new WaitForSeconds(.4f);

            Phase("Ваши карты");
            yield return cardDealer.PickUpHand(hands[localSeat]);

            Phase("Раздача завершена");
            nextStagePanel.DOFade(1f, .5f);
        }

        void Phase(string text)
        {
            if (phaseLabel) phaseLabel.text = text;
        }
    }
}
