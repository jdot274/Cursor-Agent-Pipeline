using System;
using System.IO;
using Relay.ExactRuntime;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

namespace Relay.ExactRuntime.Editor
{
    public static class BuildExactRuntime
    {
        private const string ScenePath = "Assets/Scenes/RelayExactRuntime_v1.unity";
        private const string BuildPath = "Build/WebGL";

        [MenuItem("Relay/Build Exact Runtime WebGL")]
        public static void CreateAndBuild()
        {
            Directory.CreateDirectory("Assets/Scenes");

            var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
            scene.name = "RelayExactRuntime_v1";

            var cameraObject = new GameObject("Main Camera");
            var camera = cameraObject.AddComponent<Camera>();
            camera.tag = "MainCamera";
            camera.clearFlags = CameraClearFlags.SolidColor;
            camera.backgroundColor = new Color(0.008f, 0.008f, 0.009f, 1f);
            camera.transform.SetPositionAndRotation(
                new Vector3(0f, 2.8f, -8f),
                Quaternion.Euler(11f, 0f, 0f)
            );

            var keyObject = new GameObject("Key Light");
            var key = keyObject.AddComponent<Light>();
            key.type = LightType.Directional;
            key.color = new Color(1f, 0.49f, 0.18f);
            key.intensity = 1.7f;
            keyObject.transform.rotation = Quaternion.Euler(38f, -32f, 0f);

            var bridgeObject = new GameObject("Relay Exact Runtime Bridge");
            bridgeObject.AddComponent<ExactRuntimeBridge>();

            var platform = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            platform.name = "Unity Host Platform";
            platform.transform.position = new Vector3(0f, -1.4f, 2.5f);
            platform.transform.localScale = new Vector3(4.6f, 0.12f, 4.6f);
            var platformMaterial = new Material(Shader.Find("Standard"))
            {
                color = new Color(0.025f, 0.026f, 0.028f, 1f)
            };
            platform.GetComponent<Renderer>().sharedMaterial = platformMaterial;

            RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
            RenderSettings.ambientLight = new Color(0.035f, 0.035f, 0.04f);

            EditorSceneManager.SaveScene(scene, ScenePath);
            EditorBuildSettings.scenes = new[] { new EditorBuildSettingsScene(ScenePath, true) };

            PlayerSettings.companyName = "REFRACT";
            PlayerSettings.productName = "Relay Exact Runtime";
            PlayerSettings.bundleVersion = "1.0.0";
            PlayerSettings.WebGL.template = "PROJECT:RelayExactRuntime";
            PlayerSettings.WebGL.compressionFormat = WebGLCompressionFormat.Disabled;
            PlayerSettings.WebGL.decompressionFallback = true;
            PlayerSettings.runInBackground = true;

            Directory.CreateDirectory(BuildPath);
            var report = BuildPipeline.BuildPlayer(new BuildPlayerOptions
            {
                scenes = new[] { ScenePath },
                locationPathName = BuildPath,
                target = BuildTarget.WebGL,
                options = BuildOptions.Development
            });

            if (report.summary.result != BuildResult.Succeeded)
                throw new InvalidOperationException(
                    $"Relay Exact Runtime WebGL build failed: {report.summary.result}"
                );

            Debug.Log(
                $"[RELAY_EXACT_RUNTIME] BUILD_PASS output={Path.GetFullPath(BuildPath)} " +
                $"size={report.summary.totalSize} warnings={report.summary.totalWarnings}"
            );
        }
    }
}
