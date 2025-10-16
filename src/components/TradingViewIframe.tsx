interface TradingViewIframeProps {
  symbol?: string;
  height?: string;
}

export const TradingViewIframe = ({ 
  symbol = "NASDAQ:MSFT", 
  height = "600px" 
}: TradingViewIframeProps) => {
  return (
    <div className="relative w-full" style={{ height }}>
      <iframe
        className="w-full h-full border-none rounded-2xl shadow-lg"
        src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_12345&symbol=${symbol}&interval=1&hidesidetoolbar=1&symboledit=1&saveimage=1&toolbarbg=f1f3f6&studies=[]&theme=dark&style=1&timezone=Etc/UTC&withdateranges=1`}
        allowFullScreen
      />
      <div className="absolute bottom-20 left-2 bg-gradient-to-r from-primary to-blue-400 text-white text-lg font-bold px-3 py-1 rounded-lg shadow-md border-2 border-white/10 select-none">
        T
      </div>
    </div>
  );
};
