using System.Runtime.InteropServices;
using UnityEngine;

namespace Relay.ExactRuntime
{
    public sealed class ExactRuntimeBridge : MonoBehaviour
    {
        public enum SourceMode
        {
            Spline,
            Shadertoy,
            Unity,
            Composite
        }

        [Header("Exact source")]
        [SerializeField] private SourceMode sourceMode = SourceMode.Spline;
        [SerializeField] private string splineCodeUrl =
            "https://prod.spline.design/9iDxAeZvFP613YL5/scene.splinecode";
        [SerializeField] private string shadertoyId = "ll2GD3";

        [Header("Shared semantic controls")]
        [Range(0f, 1f)] [SerializeField] private float morph = 0.62f;
        [Range(0f, 1f)] [SerializeField] private float flow = 0.58f;
        [Range(0f, 1f)] [SerializeField] private float heat = 0.78f;

#if UNITY_WEBGL && !UNITY_EDITOR
        [DllImport("__Internal")] private static extern void RelayExactSetMode(string mode);
        [DllImport("__Internal")] private static extern void RelayExactLoadSpline(string url);
        [DllImport("__Internal")] private static extern void RelayExactLoadShadertoy(string shaderId);
        [DllImport("__Internal")] private static extern void RelayExactSetControl(string name, float value);
#endif

        private void Start()
        {
            ApplyAll();
        }

        private void Update()
        {
            if (Input.GetKeyDown(KeyCode.F1)) SetMode(SourceMode.Spline);
            if (Input.GetKeyDown(KeyCode.F2)) SetMode(SourceMode.Shadertoy);
            if (Input.GetKeyDown(KeyCode.F3)) SetMode(SourceMode.Unity);
            if (Input.GetKeyDown(KeyCode.F4)) SetMode(SourceMode.Composite);
        }

        public void SetMode(SourceMode next)
        {
            sourceMode = next;
#if UNITY_WEBGL && !UNITY_EDITOR
            RelayExactSetMode(next.ToString().ToLowerInvariant());
#endif
        }

        public void LoadSpline(string url)
        {
            splineCodeUrl = url;
            sourceMode = SourceMode.Spline;
#if UNITY_WEBGL && !UNITY_EDITOR
            RelayExactLoadSpline(url);
#endif
        }

        public void LoadShadertoy(string shaderId)
        {
            shadertoyId = shaderId;
            sourceMode = SourceMode.Shadertoy;
#if UNITY_WEBGL && !UNITY_EDITOR
            RelayExactLoadShadertoy(shaderId);
#endif
        }

        public void SetSemanticControls(float nextMorph, float nextFlow, float nextHeat)
        {
            morph = Mathf.Clamp01(nextMorph);
            flow = Mathf.Clamp01(nextFlow);
            heat = Mathf.Clamp01(nextHeat);
            PushControls();
        }

        private void ApplyAll()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            RelayExactSetMode(sourceMode.ToString().ToLowerInvariant());
            if (sourceMode == SourceMode.Shadertoy)
                RelayExactLoadShadertoy(shadertoyId);
            else
                RelayExactLoadSpline(splineCodeUrl);
#endif
            PushControls();
        }

        private void PushControls()
        {
#if UNITY_WEBGL && !UNITY_EDITOR
            RelayExactSetControl("morph", morph);
            RelayExactSetControl("flow", flow);
            RelayExactSetControl("heat", heat);
#endif
        }

        private void OnGUI()
        {
            var style = new GUIStyle(GUI.skin.label)
            {
                fontSize = 18,
                fontStyle = FontStyle.Bold,
                normal = { textColor = Color.white }
            };
            GUI.Label(new Rect(28, 26, 720, 34), "UNITY 6 HOST · RELAY EXACT RUNTIME", style);
            GUI.Label(
                new Rect(28, 62, 760, 68),
                "F1 Spline exact   F2 Shadertoy exact   F3 Unity world   F4 Composite\n" +
                "Original source runtime is the fidelity master. Blender is an optional export branch.",
                GUI.skin.label
            );
        }
    }
}
