import common from "../utils/common.js";
import enums from "../utils/enums.js";

export default class {
    static verifyAuthorization = () => async (req, res, next) => {
        try {

            // Authorization logic here
            const authHeader = req.headers['authorization'];
            const token = common.getBearerToken(authHeader);
            console.log('Extracted token:', token);
            if (!token) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            // Further token validation can be done here
            const data = common.verifyToken(token);
            console.log('Decoded token data:', data);
            if (!data || !data.id) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            if (data.type !== enums.TOKEN_TYPES.ACCESS) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            req.user = data;
            next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }

    static verifyAdminRole = () => async (req, res, next) => {
        try {

            // Admin role verification logic here
            if (req.user.role !== enums.USER_ROLES.ADMIN) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }

    static verifyMentorRole = () => async (req, res, next) => {
        try {

            // Mentor role verification logic here
            if (req.user.role !== enums.USER_ROLES.MENTOR) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }

    static verifyStudentRole = () => async (req, res, next) => {
        try {

            // Student role verification logic here
            if (req.user.role !== enums.USER_ROLES.STUDENT) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }

    static verifyAuthAndStudentRole = [
        this.verifyAuthorization(),
        this.verifyStudentRole()
    ];

    static verifyAuthAndAdminRole = [
        this.verifyAuthorization(),
        this.verifyAdminRole()
    ];

    static verifyAuthAndMentorRole = [
        this.verifyAuthorization(),
        this.verifyMentorRole()
    ];
};