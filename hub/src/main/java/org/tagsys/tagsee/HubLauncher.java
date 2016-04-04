package org.tagsys.tagsee;

import java.util.HashMap;
import java.util.Map;

import com.google.gson.Gson;

import spark.Spark;
import spark.utils.StringUtils;


public class HubLauncher {

	static Hub hub = new Hub();
	static Gson gson = new Gson();
	
	public static void main(String[] args) {

		Spark.port(9092);
		
		Spark.externalStaticFileLocation("public");

		
		Spark.get("/", (req,resp)->{
			resp.redirect("/index.html");
			return "";
		});
	
		
		Spark.get("/service/discover", (req, resp)->{
			return hub.discover(req, resp);
		});
		
		Spark.post("/service/agent/create", (req, resp)->{
			return hub.createAgent(req, resp);
		});
		
		Spark.post("/service/agent/:ip/remove", (req,resp)->{
			return hub.removeAegnt(req, resp);
		});
		
		Spark.post("/service/agent/:ip/connect", (req,resp)->{
			return hub.connectAgent(req, resp);
		});
		
		Spark.post("/service/agent/:ip/disconnect", (req,resp)->{
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
