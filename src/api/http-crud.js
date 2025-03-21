import http from "./http";

export default (resource) => ({
  index(query = {}, path = '') {
    // if path is present, use it otherwise, use resource
    return http.get(`/${ path || resource }?${new URLSearchParams(query)}`);
  },

  show(id) {
    return http.get(`/${resource}/${id}`);
  },

  create(payload, config = {}) {
    return http.post(`/${resource}`, payload, config);
  },

  update(payload, id, config = {}) {
    return http.put(`/${resource}/${id}`, payload, config);
  },

  delete(id) {
    return http.delete(`/${resource}/${id}`);
  },
});