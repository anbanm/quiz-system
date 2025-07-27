using UnityEngine;
using System.IO;
using System.Collections;
using UnityEngine.UI;
using TMPro;
using System;
using System.Text;
using Newtonsoft.Json.Linq;

public class SampleWebViewSim : MonoBehaviour
{
    public static SampleWebViewSim Instance { get; private set; }
    public RectTransform targetUIElement;
    private UniWebView webView;

    private void Awake()
    {
        if (Instance == null)
        {
            Instance = this;
            if (transform.parent != null)
            {
                transform.SetParent(null);
            }
            DontDestroyOnLoad(gameObject);
        }
        else
        {
            Destroy(gameObject);
        }
    }

    public void OpenWebViewURL()
    {
        string url = UniWebViewHelper.StreamingAssetURLForPath("Simulator.html");
        StartCoroutine(OpenWebView(url));
    }

    private IEnumerator OpenWebView(string url)
    {
        if (webView != null)
        {
            Destroy(webView);
        }

        webView = gameObject.AddComponent<UniWebView>();
        AdjustWebViewSize();

        webView.SetShowToolbar(true);

        webView.OnPageFinished += HandlePageFinished;
        webView.OnLoadingErrorReceived += HandleLoadingError;
        webView.OnShouldClose += HandleShouldClose;
        webView.OnMessageReceived += HandleMessageFromWeb;

        webView.Load(url);
        webView.Show();
        yield break;
    }

    private void AdjustWebViewSize()
    {
        if (targetUIElement == null)
        {
            Debug.LogError("Target UI Element is not assigned!");
            return;
        }

        Vector3[] corners = new Vector3[4];
        targetUIElement.GetWorldCorners(corners);

        float x = corners[0].x;
        float y = Screen.height - corners[1].y;
        float width = corners[2].x - corners[0].x;
        float height = corners[1].y - corners[3].y;

        if (webView != null)
        {
            webView.Frame = new Rect(x, y, width, height);
        }
    }

    private void HandlePageFinished(UniWebView view, int statusCode, string url)
    {
        // Handle page finished loading
    }

    private void HandleLoadingError(UniWebView view, int errorCode, string errorMessage, UniWebViewNativeResultPayload payload)
    {
        // Handle loading error
    }

    private bool HandleShouldClose(UniWebView view)
    {
        // Handle WebView close
        return true;
    }

    private void HandleMessageFromWeb(UniWebView view, UniWebViewMessage message)
    {
        // Handle messages from the WebView
    }
}