package org.tagsys.tagsee;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.eclipse.jetty.websocket.api.*;
import org.eclipse.jetty.websocket.api.annotations.*;

@WebSocket
public class WebSocketHandler {


    @OnWebSocketConnect
    public void onConnect(Session session) throws Exception {
    	Hub.sessions.add(session);
    }

    @OnWebSocketClose
    public void onClose(Session session, int statusCode, String reason) {
        Hub.sessions.remove(session);
    }

    @OnWebSocketMessage
    public void onMessage(Session session, String message) {
       //server never handle the message sent from clients.
    }
    
   
    

}