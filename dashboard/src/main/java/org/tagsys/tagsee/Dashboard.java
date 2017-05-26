
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
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Timer;
import java.util.TimerTask;
import java.util.concurrent.TimeoutException;

import org.apache.log4j.Logger;
import org.eclipse.jetty.websocket.api.Session;
import org.eclipse.jetty.websocket.api.annotations.WebSocket;
import org.llrp.ltk.exceptions.InvalidLLRPMessageException;
import org.llrp.ltk.generated.custom.parameters.ImpinjPeakRSSI;
import org.llrp.ltk.generated.custom.parameters.ImpinjRFDopplerFrequency;
import org.llrp.ltk.generated.custom.parameters.ImpinjRFPhaseAngle;
import org.llrp.ltk.generated.messages.READER_EVENT_NOTIFICATION;
import org.llrp.ltk.generated.messages.RO_ACCESS_REPORT;
import org.llrp.ltk.generated.parameters.Custom;
import org.llrp.ltk.generated.parameters.EPCData;
import org.llrp.ltk.generated.parameters.EPC_96;
import org.llrp.ltk.generated.parameters.TagReportData;
import org.llrp.ltk.net.LLRPConnectionAttemptFailedException;
import org.llrp.ltk.net.LLRPEndpoint;
import org.llrp.ltk.types.LLRPMessage;
import org.llrp.ltk.types.LLRPParameter;
import org.llrp.ltk.types.UnsignedLong;
import org.llrp.ltk.types.UnsignedShort;

import com.google.gson.Gson;
import com.google.gson.stream.JsonReader;
import com.google.gson.stream.JsonWriter;

import spark.Request;
import spark.Response;
import spark.utils.StringUtils;

public class Dashboard implements LLRPEndpoint {
	// storing all agents
	private Map<String, Agent> agents = new HashMap<String, Agent>();
	private Gson gson = new Gson();
	private static Logger logger = Logger.getLogger(Agent.class);
	protected static List<Session> sessions = new ArrayList<Session>();

	public Dashboard() {

		try {

			this.load();

		} catch (Exception e) {
			e.printStackTrace();

		}

	}

	private void load() throws IOException {

		File file = new File("./data/agents.json");
		if (!file.exists()) {
			file.createNewFile();
		}

		JsonReader reader = new JsonReader(new FileReader(file));
		Agent[] agents = new Gson().fromJson(reader, Agent[].class);

		this.agents.clear();
		if (agents != null) {
			for (Agent a : agents) {
				this.agents.put(a.getIP(), a);
			}
		}

		new Timer().schedule(new TimerTask() {
			public void run() {
				JsonResult result = new JsonResult();
				result.put("type", "heartbeat");
				Dashboard.broadcast(result.toString());
			}
		}, 1000, 5000);

	}

	private void save() throws IOException {
		File file = new File("./data/agents.json");
		if (!file.exists()) {
			file.createNewFile();
		}

		FileWriter writer = new FileWriter(file);

		String result = gson.toJson(this.agents.values().toArray(new Agent[0]));

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
		
		result.put("agents", agents.values().toArray(new Agent[0]));

		return result;

	}

	private Map<String, String> bodyParams(Request req) {
		String body = req.body();
		if (!StringUtils.isEmpty(body)) {
			HashMap<String, String> bodyParams = (HashMap<String, String>) gson.fromJson(body,
					new HashMap<String, String>().getClass());
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

		if (ip == null) {
			return new JsonResult(800, "Parameters is not correct.");
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

	public JsonResult updateAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.params(":ip");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
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
			agent.connect(this);
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

		String agentIP = req.params("agentIP");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
			return new JsonResult(1003);
		}

		return new JsonResult(0);

	}

	public JsonResult startAgent(Request req, Response resp) {

		formatResponse(resp);

		String agentIP = req.params(":ip");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
			return new JsonResult(1003);
		}
		try {
			agent.connect(this);
			agent.enableImpinjExtensions();
			agent.setReaderConfiguration();
			agent.deleteROSpecs();
			if (!agent.addRoSpec(true)) {
				return new JsonResult(1005, "It fails to add ROSpec.");
			}
			if (!agent.enable()) {
				return new JsonResult(1005, "It fails to enable the reader.");
			}
			;
			if (!agent.start()) {
				return new JsonResult(1005);
			}

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

		String agentIP = req.params(":ip");

		Agent agent = agents.get(agentIP);

		if (agent == null) {
			return new JsonResult(1003);
		}

		try {
			agent.stop();
			agent.disconnect();
			return new JsonResult(0);
		} catch (TimeoutException | InvalidLLRPMessageException e) {
			e.printStackTrace();
			return new JsonResult(1013, e.getMessage());
		}

	}

	public static void broadcast(String message) {
		sessions.stream().filter(Session::isOpen).forEach(session -> {
			try {
				session.getRemote().sendString(message);
			} catch (Exception e) {
				e.printStackTrace();
			}
		});
	}

	public Tag logOneTagReport(TagReportData tr) {

		Tag tag = new Tag();

		tag.setTimestamp(new Date().getTime());

		LLRPParameter epcp = (LLRPParameter) tr.getEPCParameter();

		// epc is not optional, so we should fail if we can't find it
		String epcString = "EPC: ";
		if (epcp != null) {
			if (epcp.getName().equals("EPC_96")) {
				EPC_96 epc96 = (EPC_96) epcp;
				epcString += epc96.getEPC().toString();
				tag.setEpc(epc96.getEPC().toString());
			} else if (epcp.getName().equals("EPCData")) {
				EPCData epcData = (EPCData) epcp;
				epcString += epcData.getEPC().toString();
				tag.setData(epcData.getEPC().toString());
			}
		} else {
			logger.error("Could not find EPC in Tag Report");
			return null;
		}

		// all of these values are optional, so check their non-nullness first
		if (tr.getAntennaID() != null) {
			epcString += " Antenna: " + tr.getAntennaID().getAntennaID().toString();
			tag.setAntenna(tr.getAntennaID().getAntennaID().intValue());
		}

		if (tr.getChannelIndex() != null) {
			epcString += " ChanIndex: " + tr.getChannelIndex().getChannelIndex().toString();
			tag.setChannel(tr.getChannelIndex().getChannelIndex().intValue());
		}

		if (tr.getFirstSeenTimestampUTC() != null) {
			epcString += " FirstSeen: " + tr.getFirstSeenTimestampUTC().getMicroseconds().toString();
			tag.setFirstSeenTime(tr.getFirstSeenTimestampUTC().getMicroseconds().toLong());
		}

		if (tr.getInventoryParameterSpecID() != null) {
			epcString += " ParamSpecID: " + tr.getInventoryParameterSpecID().getInventoryParameterSpecID().toString();
		}

		if (tr.getLastSeenTimestampUTC() != null) {
			epcString += " LastFirstTimestamp: " + tr.getLastSeenTimestampUTC().getMicroseconds().toLong();
			tag.setLastSeenTime(tr.getLastSeenTimestampUTC().getMicroseconds().toLong());
		}

		if (tr.getPeakRSSI() != null) {
			epcString += " PeakRSSI: " + tr.getPeakRSSI().getPeakRSSI().intValue();
			tag.setRssi(tr.getPeakRSSI().getPeakRSSI().intValue());
		}

		if (tr.getROSpecID() != null) {
			epcString += " ROSpecID: " + tr.getROSpecID().getROSpecID().toString();
		}

		if (tr.getTagSeenCount() != null) {
			tag.setSeenCount(tr.getTagSeenCount().getTagCount().intValue());
		}

		List<Custom> clist = tr.getCustomList();

		for (Custom cd : clist) {
			if (cd.getClass() == ImpinjRFPhaseAngle.class) {
				epcString += " ImpinjPhase: " + ((ImpinjRFPhaseAngle) cd).getPhaseAngle().toString();
				tag.setPhase(((ImpinjRFPhaseAngle) cd).getPhaseAngle().toInteger().intValue());
			}
			if (cd.getClass() == ImpinjPeakRSSI.class) {
				epcString += "peakRssi:" + ((ImpinjPeakRSSI) cd).getRSSI().intValue();
				tag.setPeekRssi(((ImpinjPeakRSSI) cd).getRSSI().intValue());
			}
			if (cd.getClass() == ImpinjRFDopplerFrequency.class) {
				epcString += "Doppler:" + ((ImpinjRFDopplerFrequency) cd).getDopplerFrequency().intValue();
				tag.setDoppler(((ImpinjRFDopplerFrequency) cd).getDopplerFrequency().intValue());
			}

		}

		logger.info(epcString);

		return tag;

	}

	@Override
	public void messageReceived(LLRPMessage message) {

		logger.info("Received " + message.getName() + " message asychronously");

		if (message.getTypeNum() == RO_ACCESS_REPORT.TYPENUM) {
			RO_ACCESS_REPORT report = (RO_ACCESS_REPORT) message;

			List<TagReportData> tdlist = report.getTagReportDataList();

			List<Tag> list = new ArrayList<Tag>();
			Tag tag = null;
			for (TagReportData tr : tdlist) {
				tag = logOneTagReport(tr);
				if (tag != null) {
					list.add(logOneTagReport(tr));
				}
			}

			JsonResult result = new JsonResult();
			result.put("type","readings");
			result.put("tags", list);
			broadcast(result.toString());

		} else if (message.getTypeNum() == READER_EVENT_NOTIFICATION.TYPENUM) {
			// TODO
		}
	}

	@Override
	public void errorOccured(String s) {
		logger.error(s);
	}

}
