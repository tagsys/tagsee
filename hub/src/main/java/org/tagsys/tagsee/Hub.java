
/**
 * 
 * Hub contains many reader agents. It is designed to accommodate agents and maintain their states.
 * 
 *  @author Lei Yang
 *  @date 2016/4/2
 *  
 */

package org.tagsys.tagsee;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeoutException;

import org.llrp.ltk.exceptions.InvalidLLRPMessageException;
import org.llrp.ltk.net.LLRPConnectionAttemptFailedException;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import spark.Request;
import spark.Response;
import spark.utils.StringUtils;

public class Hub {
	// storing all agents
	private Map<String, Agent> agents = new HashMap<String, Agent>();
	private Gson gson = new Gson();
	
	
	public Hub(){
		
		try {
			
			this.load();

		} catch (Exception e) {
			e.printStackTrace();
			
		} 
				
		
	}
	
	private void load() throws IOException{
		
		File file = new File("public/data/agents.json");
		if(!file.exists()){
			file.createNewFile();
		}
		
		JsonReader reader = new JsonReader(new FileReader(file));
		Agent[] agents = new Gson().fromJson(reader, Agent[].class);
		
		this.agents.clear();
		if(agents!=null)
		{
			for(Agent a: agents){
				this.agents.put(a.getIP(),a);
			}
		}
	}
	
	private void save() throws IOException{
		File file = new File("public/data/agents.json");
		if(!file.exists()){
			file.createNewFile();
		}
		
		FileWriter writer = new FileWriter(file);

		String result = gson.toJson(this.agents.values().toArray(new Agent[0]));
		
		System.out.println(result);
		
		writer.write(result);
		
		writer.close();
	}

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
	
	private Map<String, String> bodyParams(Request req){
		String body = req.body();
		if(!StringUtils.isEmpty(body)){
			HashMap<String, String> bodyParams = (HashMap<String, String>)gson.fromJson(body, new HashMap<String, String>().getClass());
			return bodyParams;
		}
		return new HashMap<String, String>();
	}

	public JsonResult createAgent(Request req, Response resp) {

		formatResponse(resp);

		Map<String, String> bodyParams = this.bodyParams(req);
 		
		String ip = bodyParams.get("ip");
		String name = bodyParams.get("name");
		String remark = bodyParams.get("remark");
		
		if(ip==null){
			return new JsonResult(800,"Parameters is not correct.");
		}

		if (agents.containsKey(ip)) {
			return new JsonResult(1002);
		} else {
			try {
				Agent agent = new Agent(ip);
				agent.setName(name);
				agent.setRemark(remark);
				agent.setCreatedTime(new Date().getTime());
				agents.put(ip, agent);
				this.save();
				return new JsonResult();
			} catch (IOException e) {
				e.printStackTrace();
				return new JsonResult(500);
			}
			
		}

	}
	
	public JsonResult updateAgent(Request req, Response resp){
		
		formatResponse(resp);

		String agentIP = req.params(":ip");

		Agent agent = agents.get(agentIP);
		
		if (agent==null) {
			return new JsonResult(1003);
		}

		try {
			Map<String, String> bodyParams = this.bodyParams(req);
			agent.setName(bodyParams.get("name"));
			agent.setRemark(bodyParams.get("remark"));
			agent.setLastUpdatedTime(new Date().getTime());
			
			this.save();
			return new JsonResult();
		} catch (IOException e) {
			e.printStackTrace();
			return new JsonResult(500);
		}
		
		
	}

	public JsonResult removeAegnt(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.params(":ip");

		if (!agents.containsKey(agentIP)) {
			return new JsonResult(1003);
		}

		try {
			agents.remove(agentIP);
			this.save();
			return new JsonResult();
		} catch (IOException e) {
			e.printStackTrace();
			return new JsonResult(500);
		}
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
