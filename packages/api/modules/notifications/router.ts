import { clearAllNotifications } from "./procedures/clear-all";
import { getPreferences } from "./procedures/get-preferences";
import { listNotifications } from "./procedures/list-notifications";
import { markAllNotificationsRead } from "./procedures/mark-all-read";
import { markNotificationsRead } from "./procedures/mark-notifications-read";
import { sendTestNotification } from "./procedures/send-test";
import { subscribeWebPush } from "./procedures/subscribe-web-push";
import { unreadCount } from "./procedures/unread-count";
import { unsubscribeWebPush } from "./procedures/unsubscribe-web-push";
import { updatePreference } from "./procedures/update-preference";
import { webPushPublicKey } from "./procedures/web-push-public-key";

export const notificationsRouter = {
	list: listNotifications,
	unreadCount,
	markRead: markNotificationsRead,
	markAllRead: markAllNotificationsRead,
	clearAll: clearAllNotifications,
	getPreferences,
	updatePreference,
	sendTest: sendTestNotification,
	subscribeWebPush,
	unsubscribeWebPush,
	webPushPublicKey,
};
