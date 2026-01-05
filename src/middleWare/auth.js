const auth = async (req, res, next) => {

    try {
        const TOKEN_KEY = "x-cross-auth";
        let token;

        token = req.cookies?.[TOKEN_KEY];

        const origin = req.headers.origin || req.headers.host;
        const isLocalhost = origin && (origin.includes('localhost') || origin.includes('127.0.0.1'));

        if (!token && isLocalhost) {
            token = req.headers[TOKEN_KEY];
        }

        if (!token) {

            return res.status(401).json({ status: "error", msg: "Unauthorized Request" });
        }

        else {

            let headerSession = Buffer.from(Buffer.from(Buffer.from(token, 'base64').toString('ascii'), 'base64').toString('ascii'), 'base64').toString('ascii');

            headerSession = JSON.parse(headerSession);
            req.headerSession = {};
            req.headerSession = headerSession;
            next()

        }
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message, err: error.stack })
    }

}
module.exports = { auth }









