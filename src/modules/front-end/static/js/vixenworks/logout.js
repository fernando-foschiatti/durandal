vixenworks.logout = () => {
    document.cookie = `jwt=${vixenworks.restfulApi.jwt}; Path=${vixenworks.frontEndBasePath}; Max-age=0`;
    window.location.replace(`${window.location.origin}${vixenworks.frontEndBasePath}`);
};
