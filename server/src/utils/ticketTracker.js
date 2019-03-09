const {ticketDB} = require('../dao/');
const {execInSeries} = require('../utils/collectionUtils');
let ticketTracker = null;

// The ID is the ritm_id for everything
class TicketTracker {

  constructor() {
    this.ticketDB = ticketDB;
  }

  async firstSeen(list) {
    return execInSeries(list, async item => {
      const id = item.ritm_id;
      const existing = await this.ticketDB.findById(id);
      if (!existing) {
        item.firstSeenTime = Date.now();
        item.startTimes = [];
        item.stopTimes = [];
        item.finishTime = 0;
        item.resentCount = 0;
        await this.ticketDB.upsertWithId(id, item);
      }
    });
  }

  async startTicket(item) {
    const existing = await this.ticketDB.findById(item.ritm_id);
    if (!existing) {
      throw new Error('Started a ticket before firstSee\'ing it!');
    }
    else {
      existing.startTimes.push(Date.now());
      await this.ticketDB.upsertWithId(item.ritm_id, existing);
    }
  }

  async stopTicket(item, wasResent = false) {
    const existing = await this.ticketDB.findById(item.ritm_id);
    if (!existing) {
      throw new Error('Started a ticket before firstSee\'ing it!');
    }
    else {
      existing.stopTimes.push(Date.now());
      if (wasResent) {
        existing.resentCount = existing.resentCount + 1;
      }
      await this.ticketDB.upsertWithId(item.ritm_id, existing);
    }
  }


  async finishTicket(item) {
    const existing = await this.ticketDB.findById(item.ritm_id);
    if (!existing) {
      throw new Error('Started a ticket before firstSee\'ing it!');
    }
    else {
      const now = Date.now();
      existing.stopTimes.push(now);
      existing.finishTime = now;
      await this.ticketDB.upsertWithId(item.ritm_id, existing);
    }
  }
}


if (!ticketTracker) {
  ticketTracker = new TicketTracker();
}

module.exports = ticketTracker;
