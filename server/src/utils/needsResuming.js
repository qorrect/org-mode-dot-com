const dao = require('../dao/index');


class NeedsResuming {


  async getTask(sys_id) {
    const task = await dao.findById(sys_id);
    return task ? task : {};
  }

  async remove(sys_id) {
    return dao.remove(sys_id);
  }

  async insert(sys_id, body) {
    return dao.upsertWithId(sys_id, body);
  }

}

module.exports = new NeedsResuming();
