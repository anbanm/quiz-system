using UnityEngine;
using System.IO;
//using UniWebView;
using System.Collections;
using UnityEngine.UI;
using TMPro;
using System;
using System.Text;
using Newtonsoft.Json.Linq;

public class SampleWebView : MonoBehaviour
{
    public static SampleWebView Instance { get; private set; }
    public RectTransform targetUIElement;
    public TextMeshProUGUI targetText;
    public TextMeshProUGUI scoreText;
    public TextMeshProUGUI PointsText;
    public int pointsToAward;
    private CoinManager coinManager;
    private UniWebView webView;
    private string filename="testdata2.json";

    private void Awake() => Instance = this;

    public void OpenWebViewURL(string url)
    {
        StartCoroutine(OpenWebView(url));
    }

    public void OpenLocalWebView()
    {
        string url = UniWebViewHelper.StreamingAssetURLForPath("WebTest.html");
        OpenWebViewURL(url);
        
       
    }
    
    public void setFilename(string name)
    {
        filename = name;
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
        Debug.Log($"Page loaded: {url}");
        view.EvaluateJavaScript("Unity.call('Page Loaded')");
        string filePath = Path.Combine(Application.streamingAssetsPath, filename);
        if (ValidateJson(filePath))
        {
            SendJsonDataToWebView(filePath);        }
        else
        {
            Debug.LogError("Invalid JSON data in testdata.json");
        }
        
       // SampleWebView.Instance.SendPlainTextDataToWebView("helloworld");
    }

    private void HandleLoadingError(UniWebView view, int errorCode, string errorMessage, UniWebViewNativeResultPayload payload)
    {
        Debug.LogError($"WebView error: {errorMessage}");
    }

    private bool HandleShouldClose(UniWebView view)
    {
        Debug.Log("WebView closed");
        DestroyTheWebView();
        return true;
    }

    private void HandleMessageFromWeb(UniWebView view, UniWebViewMessage message)
    {
        Debug.Log($"Received message from WebView: {message.RawMessage}");

        if (message.Path == "event")
        {
            string eventData = message.Args.ContainsKey("data") ? message.Args["data"] : "No Data";
            Debug.Log($"Event Data: {eventData}");

            try
            {
                var result = JObject.Parse(eventData);
                string testID = result["testID"].ToString();
                int correctAnswers = (int)result["correctAnswers"];
                int totalQuestions = (int)result["totalQuestions"];
                int pointsAwarded = (int)result["pointsAwarded"];
                pointsToAward = pointsAwarded;

                string score = $"{correctAnswers}/{totalQuestions}";
                Debug.Log($"Test ID: {testID}, Score: {score}, Points Awarded: {pointsAwarded}");

                if (targetText != null)
                {
                    targetText.text += $"\nTest ID: {testID}\nScore: {score}\nPoints Awarded: {pointsAwarded}";
                }

                if (scoreText != null)
                {
                    scoreText.text += $"\n{score}";
                }

                if (PointsText != null)
                {
                    PointsText.text += $"\n{pointsAwarded}";
                }
                
                coinManager = GameObject.Find("CoinManager").GetComponent<CoinManager>();
                if (coinManager != null)
                {
                    coinManager.EarnCoins(pointsToAward);
                 //   DestroyTheWebView();

                

                }
            }
            catch (Exception ex)
            {
                Debug.LogError($"Failed to parse JSON: {ex.Message}");
            }
        }
    }

    public void DestroyTheWebView()
    {
        if (webView != null)
        {
            webView.Hide();
            Destroy(webView);
            webView = null;
        }
    }
    
    public void SendJsonDataToWebView(string filePath)
    {
        if (webView != null)
        {
            string jsonData = File.ReadAllText(filePath,Encoding.UTF8).Trim();
            jsonData =jsonData.Replace("\n", "").Replace("\r", "");
            string escapedJsonData = jsonData.Replace("\\", "\\\\").Replace("\"", "\\\"");
            string script = $"receiveFromUnity(\"{escapedJsonData}\");";
            Debug.Log($"Executing script: {script}"); // Log the script being executed
            webView.EvaluateJavaScript(script, (payload) =>
            {
                if (payload.resultCode == "0")
                {
                    Debug.Log("✅ JSON successfully sent to WebView.");
                }
                else
                {
                    Debug.LogError("❌ Failed to send JSON to WebView: " + payload.data);
                }
            });
            //string jsonData2 = "{ \"name\": \"John Doe\", \"age\": 30 }";
          //  string escapedJsonData2 = jsonData2.Replace("\\", "\\\\").Replace("\"", "\\\"");
           // string script2 = $"receiveFromUnity(\"{escapedJsonData2}\");";
          //  Debug.Log($"Executing script2: {script2}"); // Log the script being executed
          //  webView.EvaluateJavaScript(script2);
        }
    }
    
    public void SendPlainTextDataToWebView(string plainTextData)
    {
        if (webView != null)
        {
            string script = $"receivePlainTextFromUnity(\"{plainTextData.Replace("\"", "\\\"")}\");";
            webView.EvaluateJavaScript(script);
        }
    }
    private bool ValidateJson(string filePath)
    {
        try
        {
            string jsonData = File.ReadAllText(filePath);
            JToken parsedData = JToken.Parse(jsonData);
            Debug.Log("JSON is valid.");
            return true;
        }
        catch (Exception ex)
        {
            Debug.LogError($"Invalid JSON: {ex.Message}");
            return false;
        }
    }
    
    
}
