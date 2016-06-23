package org.tagsys.tagsee;

import org.apache.log4j.BasicConfigurator;
import org.apache.log4j.Level;
import org.apache.log4j.Logger;
import org.apache.mina.common.RuntimeIOException;

import com.google.gson.Gson;

import spark.Spark;
import java.awt.Desktop;
import java.net.URI;


public class Launcher {

	private static Dashboard hub = new Dashboard();
	private Gson gson = new Gson();

	public static void main(String[] args) {

		BasicConfigurator.configure();

		Logger.getRootLogger().setLevel(Level.INFO);

		Spark.port(9092);
		
		Spark.externalStaticFileLocation("public");

		Spark.webSocket("/socket", WebSocketHandler.class);

		Spark.init();
		
		Spark.before((request, response) -> {
			response.header("Access-Control-Allow-Origin", "*");
			response.header("Access-Control-Request-Method", "*");
			response.header("Access-Control-Allow-Headers", "X-Requested-With");
		});

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
		
		Spark.exception(RuntimeIOException.class, (e, req, resp)->{
		
			resp.status(200);
			resp.type("application/json");
			
			resp.body(new JsonResult(505,e.getMessage()).toString());
			
		});
		
		try {
			 String url = "http://localhost:9092";

		        if (Desktop.isDesktopSupported()) {
		            // Windows
		            Desktop.getDesktop().browse(new URI(url));
		        } else {
		            // Ubuntu
		            Runtime runtime = Runtime.getRuntime();
		            runtime.exec("/usr/bin/firefox -new-window " + url);
		        }			
		} catch (Exception e2) {
			System.out.println("It fails to open the default brower.");
		}
		
		System.out.println("You can access the dashboard at http://localhost:9092");
		

	}

}
