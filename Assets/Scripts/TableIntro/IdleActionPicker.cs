using System;
using System.Collections;
using UnityEngine;
using Random = UnityEngine.Random;

namespace BazaarBlot.TableIntro
{
    /// <summary>
    /// Every few seconds fires a random Animator trigger (Puff, Scratch, AdjustHat, Drum...),
    /// so seated characters never freeze and never move in sync.
    /// </summary>
    public class IdleActionPicker : MonoBehaviour
    {
        [Serializable]
        public struct IdleAction
        {
            public string trigger;
            [Min(0)] public float weight;
        }

        public Animator animator;
        public IdleAction[] actions =
        {
            new IdleAction { trigger = "Puff", weight = 2 },
            new IdleAction { trigger = "Drum", weight = 1 },
        };
        public Vector2 pauseSeconds = new Vector2(3f, 7f);

        Coroutine loop;

        void OnEnable() => loop = StartCoroutine(Loop());

        void OnDisable()
        {
            if (loop != null) StopCoroutine(loop);
        }

        IEnumerator Loop()
        {
            yield return new WaitForSeconds(Random.Range(1f, pauseSeconds.x));
            while (true)
            {
                var trigger = Pick();
                if (!string.IsNullOrEmpty(trigger)) animator.SetTrigger(trigger);
                yield return new WaitForSeconds(Random.Range(pauseSeconds.x, pauseSeconds.y));
            }
        }

        string Pick()
        {
            float total = 0;
            foreach (var a in actions) total += a.weight;
            float roll = Random.value * total;
            foreach (var a in actions)
            {
                if ((roll -= a.weight) <= 0) return a.trigger;
            }
            return actions.Length > 0 ? actions[^1].trigger : null;
        }
    }
}
