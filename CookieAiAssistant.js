/* Cookie AI Assistant v2 */

.cookieAiAssistant{
  position:fixed;
  right:22px;
  bottom:22px;
  z-index:9999;
  font-family:inherit;
}

.cookieAiLauncher{
  border:0;
  display:flex;
  align-items:center;
  gap:10px;
  min-height:54px;
  padding:14px 18px;
  border-radius:999px;
  color:#20172f;
  background:linear-gradient(135deg,#ffbd49,#f28a1e);
  font-weight:1000;
  box-shadow:0 18px 44px rgba(18,7,29,.28);
  cursor:pointer;
}

.cookieAiLauncher span{
  width:30px;
  height:30px;
  display:grid;
  place-items:center;
  border-radius:999px;
  background:#fff;
}

.cookieAiPanel{
  width:min(410px,calc(100vw - 28px));
  height:min(680px,calc(100vh - 112px));
  margin-bottom:14px;
  display:grid;
  grid-template-rows:auto auto auto 1fr auto auto;
  overflow:hidden;
  border-radius:26px;
  background:#fff8ef;
  border:1px solid rgba(42,16,59,.18);
  box-shadow:0 30px 90px rgba(18,7,29,.38);
}

.cookieAiHeader{
  display:flex;
  justify-content:space-between;
  gap:12px;
  align-items:center;
  padding:16px;
  color:#fff;
  background:
    radial-gradient(circle at 90% 10%,rgba(255,189,73,.18),transparent 28%),
    linear-gradient(135deg,#2a103b,#12071d);
}

.cookieAiHeader strong,
.cookieAiHeader span{
  display:block;
}

.cookieAiHeader span{
  color:#f7ddff;
  font-size:12px;
  margin-top:2px;
}

.cookieAiHeader button{
  width:34px;
  height:34px;
  border:0;
  border-radius:999px;
  color:#20172f;
  background:#ffbd49;
  font-size:24px;
  line-height:1;
  cursor:pointer;
}

.cookieAiLeadFields{
  display:grid;
  grid-template-columns:1fr 1fr;
  gap:8px;
  padding:12px 12px 0;
}

.cookieAiLeadFields input{
  min-width:0;
  border:1px solid rgba(42,16,59,.14);
  border-radius:999px;
  padding:9px 11px;
  font-size:12px;
  background:#fff;
  color:#2a103b;
  outline:none;
}

.cookieAiLeadFields input:focus{
  border-color:#ffbd49;
  box-shadow:0 0 0 3px rgba(255,189,73,.18);
}

.cookieAiQuick{
  display:flex;
  gap:8px;
  overflow-x:auto;
  padding:12px 12px 0;
}

.cookieAiQuick button{
  flex:0 0 auto;
  border:1px solid rgba(42,16,59,.12);
  border-radius:999px;
  padding:8px 10px;
  background:#fff;
  color:#2a103b;
  font-weight:900;
  font-size:12px;
  cursor:pointer;
}

.cookieAiMessages{
  padding:12px;
  overflow:auto;
  display:flex;
  flex-direction:column;
  gap:10px;
}

.cookieAiBubble{
  white-space:pre-wrap;
  max-width:90%;
  padding:11px 13px;
  border-radius:18px;
  font-size:14px;
  line-height:1.45;
}

.cookieAiBubble.assistant{
  align-self:flex-start;
  color:#2a103b;
  background:#fff;
  border:1px solid rgba(42,16,59,.1);
}

.cookieAiBubble.user{
  align-self:flex-end;
  color:#fff;
  background:linear-gradient(135deg,#2a103b,#12071d);
}

.cookieAiForm{
  display:flex;
  gap:8px;
  padding:12px;
  border-top:1px solid rgba(42,16,59,.1);
}

.cookieAiForm input{
  min-width:0;
  flex:1;
  border:1px solid rgba(42,16,59,.18);
  border-radius:999px;
  padding:12px 14px;
  outline:none;
}

.cookieAiForm input:focus{
  border-color:#ffbd49;
  box-shadow:0 0 0 3px rgba(255,189,73,.22);
}

.cookieAiForm button{
  border:0;
  border-radius:999px;
  padding:0 16px;
  color:#20172f;
  background:linear-gradient(135deg,#ffbd49,#f28a1e);
  font-weight:1000;
  cursor:pointer;
}

.cookieAiForm button:disabled{
  opacity:.55;
  cursor:not-allowed;
}

.cookieAiFooter{
  display:flex;
  justify-content:space-between;
  gap:10px;
  align-items:center;
  padding:10px 12px;
  color:#6a5b74;
  font-size:11px;
  background:#fff3e4;
}

.cookieAiFooter div{
  display:flex;
  gap:8px;
  align-items:center;
}

.cookieAiFooter em{
  color:#2a103b;
  font-style:normal;
  font-weight:800;
}

.cookieAiFooter button{
  border:0;
  background:transparent;
  color:#2a103b;
  font-weight:900;
  cursor:pointer;
}

@media(max-width:560px){
  .cookieAiAssistant{
    right:12px;
    bottom:12px;
  }

  .cookieAiPanel{
    width:calc(100vw - 24px);
    height:min(650px,calc(100vh - 96px));
  }

  .cookieAiLeadFields{
    grid-template-columns:1fr;
  }

  .cookieAiLauncher strong{
    display:none;
  }
}
