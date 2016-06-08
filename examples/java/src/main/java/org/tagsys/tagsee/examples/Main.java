package org.tagsys.tagsee.examples;

import java.io.StringReader;
import java.net.URI;

import javax.json.Json;
import javax.json.JsonObject;

import org.apache.http.HttpHost;
import org.apache.http.HttpResponse;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;

public class Main {

	/**
	 * main
	 * 
	 * @param args
	 * @throws Exception
	 */
	public static void main(String[] args) throws Exception {

		final WebSocketEndPoint clientEndPoint = new WebSocketEndPoint(new URI("ws://localhost:9092/socket"));

		clientEndPoint.addMessageHandler(new WebSocketEndPoint.MessageHandler() {
			public void handleMessage(String message) {
				System.out.println(message);
			}
		});

		String ip = "192.168.1.213";
		String startUrl = "http://localhost:9092/service/agent/" + ip + "/start";
		String stopUrl = "http://localhost:9092/service/agent/" + ip + "/stop";

		HttpClient client = HttpClientBuilder.create().build();
		HttpResponse response = null;

		HttpGet startRequest = new HttpGet(startUrl);
		response = client.execute(startRequest);
		System.out.println("Response code:" + response.getStatusLine().getStatusCode());

		// collect 10 seconds data.
		Thread.sleep(20000);

		HttpGet stopRequst = new HttpGet(stopUrl);
		response = client.execute(stopRequst);
		System.out.println("Response code:" + response.getStatusLine().getStatusCode());

	}

}
