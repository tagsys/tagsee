package org.tagsys.tagsee;

import java.util.HashMap;
import java.util.Map;
import spark.Spark;


public class HubLauncher {

	static Hub hub = new Hub();
	
	
	public static void main(String[] args) {

		Spark.port(9091);
		
		Spark.get("/service/discover", (req, resp)->{
			return hub.discover(req, resp);
		});
		
		Spark.post("/service/agent/create", (req, resp)->{
			return hub.createAgent(req, resp);
		});
		
		Spark.post("/service/agent/remove", (req,resp)->{
			return hub.removeAegnt(req, resp);
		});
		
		Spark.post("/service/agent/:agentIP/connect", (req,resp)->{
			return hub.connectAgent(req, resp);
		});
		
		Spark.post("/service/agent/:agentIP/disconnect", (req,resp)->{
			return hub.disconnectAgent(req, resp);
		});

		Spark.post("/service/agent/:agentIP/start", (req,resp)->{
			return hub.startAgent(req, resp);
		});
		
		Spark.post("/service/agent/:agentIP/stop", (req,resp)->{
			return hub.stopAgent(req, resp);
		});
		
	}

}
