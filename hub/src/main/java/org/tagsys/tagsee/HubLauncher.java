package org.tagsys.tagsee;

import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;

import com.google.gson.Gson;

import spark.Spark;

public class HubLauncher {

	private static Hub hub = new Hub();
	private Gson gson = new Gson();

	public static void main(String[] args) {

		BasicConfigurator.configure();

		Logger.getRootLogger().setLevel(Level.INFO);

		Spark.port(9092);

		Spark.externalStaticFileLocation("public");

		Spark.webSocket("/service/reading", WebSocketHandler.class);

		Spark.init();

		Spark.get("/", (req, resp) -> {
			resp.redirect("/index.html");
			return "";
		});

		Spark.get("/service/discover", (req, resp) -> {
			return hub.discover(req, resp);
		});

		Spark.post("/service/agent/create", (req, resp) -> {
			return hub.createAgent(req, resp);
		});

		Spark.post("/service/agent/:ip/update", (req, resp) -> {
			return hub.updateAgent(req, resp);
		});

		Spark.post("/service/agent/:ip/remove", (req, resp) -> {
			return hub.removeAegnt(req, resp);
		});

		Spark.post("/service/agent/:ip/connect", (req, resp) -> {
			return hub.connectAgent(req, resp);
		});

		Spark.post("/service/agent/:ip/disconnect", (req, resp) -> {
			return hub.disconnectAgent(req, resp);
		});

		Spark.get("/service/agent/:ip/start", (req, resp) -> {
			return hub.startAgent(req, resp);
		});

		Spark.get("/service/agent/:ip/stop", (req, resp) -> {
			return hub.stopAgent(req, resp);
		});

	}

}
