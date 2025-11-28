//+------------------------------------------------------------------+
//| FlowrexBridgeEA.mq5                                             |
//| Sends recent candles to Flowrex (Market Playbook Agent backend) |
//+------------------------------------------------------------------+
#property copyright "Flowrex"
#property version   "1.00"
#property strict

//--- input parameters
input string InpWebhookURL      = "https://your-server.com/webhook/mt5";  // Backend webhook URL
input string InpInstrumentType  = "FOREX";                                // "FOREX", "CRYPTO", "FUTURES", etc.
input int    InpTimeframeMinutes= 15;                                     // Execution timeframe in minutes (for info)
input int    InpCandlesToSend   = 120;                                    // How many recent candles to send
input string InpSecretHeader    = "your-secret-here";                     // Must match MT5_WEBHOOK_SECRET in .env
input int    InpSendEveryBars   = 1;                                      // Send every Nth bar (1 = every bar)
input bool   InpSendOnEveryTick = false;                                  // If true, sends on every new bar immediately

//--- globals
datetime g_last_bar_time = 0;
int      g_bar_skip      = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("FlowrexBridgeEA initialized on ", _Symbol, " / ", EnumToString(Period()));

   // Note: In MT5, you must manually add the URL in Tools -> Options -> Expert Advisors -> Allow WebRequest
   Print("Make sure WebRequest is enabled for: ", InpWebhookURL);

   // set a timer as backup (not strictly necessary if using OnTick)
   EventSetTimer(10); // every 10 seconds check

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
}

//+------------------------------------------------------------------+
//| Timer event                                                      |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(!InpSendOnEveryTick)
      TrySendIfNewBar();
}

//+------------------------------------------------------------------+
//| Tick event                                                       |
//+------------------------------------------------------------------+
void OnTick()
{
   if(InpSendOnEveryTick)
      TrySendIfNewBar();
}

//+------------------------------------------------------------------+
//| Detect new bar and send                                          |
//+------------------------------------------------------------------+
void TrySendIfNewBar()
{
   MqlRates rates[];
   int copied = CopyRates(_Symbol, PERIOD_CURRENT, 0, InpCandlesToSend, rates);
   if(copied <= 0)
   {
      Print("FlowrexBridgeEA: CopyRates failed: ", GetLastError());
      return;
   }

   ArraySetAsSeries(rates, true);
   datetime current_bar_time = rates[0].time;

   if(current_bar_time == g_last_bar_time)
      return; // no new bar

   g_bar_skip++;
   if(g_bar_skip < InpSendEveryBars)
      return;

   g_last_bar_time = current_bar_time;
   g_bar_skip      = 0;

   // Build and send JSON
   string json = BuildJSONPayload(rates, copied);
   SendToFlowrex(json);
}

//+------------------------------------------------------------------+
//| Build JSON payload                                               |
//| Matches backend runAnalysisFromBody format                       |
//+------------------------------------------------------------------+
string BuildJSONPayload(MqlRates &rates[], int count)
{
   // We will send most recent 'count' candles (already limited by CopyRates)
   string json = "{";

   // symbol, instrument, timeframe
   json += "\"symbol\":\"" + _Symbol + "\",";
   json += "\"instrument\":\"" + InpInstrumentType + "\",";
   json += "\"timeframe\":\"" + IntegerToString(InpTimeframeMinutes) + "m\",";

   // candles array
   json += "\"candles\":[";
   for(int i = count - 1; i >= 0; i--) // from oldest to newest
   {
      MqlRates r = rates[i];
      long t = (long)r.time; // epoch seconds

      json += "{";
      json += "\"time\":" + LongToString(t) + ",";
      json += "\"open\":" + DoubleToString(r.open, _Digits) + ",";
      json += "\"high\":" + DoubleToString(r.high, _Digits) + ",";
      json += "\"low\":" + DoubleToString(r.low, _Digits) + ",";
      json += "\"close\":" + DoubleToString(r.close, _Digits) + ",";
      json += "\"volume\":" + LongToString((long)r.tick_volume);
      json += "}";

      if(i != 0)
         json += ",";
   }
   json += "]";

   json += "}";

   return json;
}

//+------------------------------------------------------------------+
//| Send JSON to backend using WebRequest                            |
//+------------------------------------------------------------------+
void SendToFlowrex(const string json)
{
   char   data[];
   char   result[];
   string headers;
   string result_headers;
   int    timeout = 10000; // 10 seconds

   // Prepare headers
   headers  = "Content-Type: application/json\r\n";
   headers += "X-Flowrex-Secret: " + InpSecretHeader + "\r\n";

   int json_len = StringLen(json);
   ArrayResize(data, json_len);
   int copied = StringToCharArray(json, data, 0, json_len);
   if(copied <= 0)
   {
      Print("FlowrexBridgeEA: StringToCharArray failed");
      return;
   }

   Print("FlowrexBridgeEA: Sending ", json_len, " bytes to ", InpWebhookURL);

   int status = WebRequest("POST",
                           InpWebhookURL,
                           headers,
                           timeout,
                           data,
                           json_len,
                           result,
                           result_headers);

   if(status == -1)
   {
      int err = GetLastError();
      Print("FlowrexBridgeEA: WebRequest error: ", err,
            ". Check that URL is allowed in Tools->Options->Expert Advisors->WebRequest.");
      return;
   }

   string resp = CharArrayToString(result, 0, ArraySize(result));
   Print("FlowrexBridgeEA: Response status=", status, ", body=", resp);
}
