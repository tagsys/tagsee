
/**
 * 
 * Hub contains many reader agents. It is designed to accommodate agents and maintain their states.
 * 
 *  @author Lei Yang
 *  @date 2016/4/2
 *  
 */

package org.tagsys.tagsee;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import org.llrp.ltk.exceptions.InvalidLLRPMessageException;
import org.llrp.ltk.net.LLRPConnectionAttemptFailedException;

import com.google.gson.Gson;

import spark.Request;
import spark.Response;

public class Hub {
	// storing all agents
	private Map<String, Agent> agents = new HashMap<String, Agent>();
	private Gson gson = new Gson();

	private void formatResponse(Response resp) {
		resp.status(200);
		resp.type("application/json");
	}

	public JsonResult discover(Request req, Response resp) {

		formatResponse(resp);

		JsonResult result = new JsonResult();

		result.put("agents", agents);

		return result;
	}

	public JsonResult createAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");
		
		if(agentIP==null){
			return new JsonResult(800,"Parameters is not correct.");
		}

		JsonResult result = new JsonResult();

		if (agents.containsKey(agentIP)) {
			result.put("errorCode", 1002);
		} else {
			Agent agent = new Agent(agentIP);
			agents.put(agentIP, agent);
		}
		return result;

	}

	public JsonResult removeAegnt(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");

		if (!agents.containsKey(agentIP)) {
			return new JsonResult(1003);
		}

		agents.remove(agentIP);

		return new JsonResult(0);
	}

	public JsonResult connectAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");

		JsonResult result = new JsonResult();

		if (!agents.containsKey(agentIP)) {
			result.setErrorCode(1003);
			return result;
		}

		Agent agent = agents.get(agentIP);

		try {
			agent.connect();
			return result;
		} catch (Exception e) {
			result.setErrorCode(1013);
			result.setErrorMessage(e.getMessage());
			return result;
		}

	}

	public JsonResult disconnectAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");

		if (!agents.containsKey(agentIP)) {
			return new JsonResult(1003);
		}

		Agent agent = agents.get(agentIP);

		try {
			agent.disconnect();
			return new JsonResult();
		} catch (InvalidLLRPMessageException e) {
			return new JsonResult(1004, e.getMessage());
		} catch (TimeoutException e) {
			return new JsonResult(1013, e.getMessage());
		}

	}

	public JsonResult configureReader(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
			return new JsonResult(1003);
		}

		return new JsonResult(0);

	}

	public JsonResult startAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
			return new JsonResult(1003);
		}
		try {
			if (agent.getStatus() == 0) {
				agent.connect();
			}
			agent.start();
			return new JsonResult(0);
		} catch (LLRPConnectionAttemptFailedException e) {
			e.printStackTrace();
			return new JsonResult(1013, e.getMessage());
		} catch (TimeoutException e) {
			e.printStackTrace();
			return new JsonResult(1013, e.getMessage());
		} catch (InvalidLLRPMessageException e) {
			e.printStackTrace();
			return new JsonResult(-1, e.getMessage());
		}
	}

	public JsonResult stopAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.queryParams("agentIP");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
			return new JsonResult(1003);
		}

		try {
			agent.stop();
			return new JsonResult(0);
		} catch (TimeoutException | InvalidLLRPMessageException e) {
			e.printStackTrace();
			return new JsonResult(1013, e.getMessage());
		}

	}

}
