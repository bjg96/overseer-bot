import { Client, Emoji, Message } from "discord.js";

import { DiscordService } from "../../services/app/discord_service";
import { DataService } from "../../services/app/data_service";
import { Hook } from "../../utils/hook";
import { firestore } from "firebase-admin";

const decrement = firestore.FieldValue.increment(-1);
const increment = firestore.FieldValue.increment(1);

/**
 * features:
 *  * vote eck - vote for eck as the worst david
 *  * vote peace - vote for peace cream david as the best david
 *  * display votes - see the vote count so far
 */
export class DavidBotHook implements Hook {
  private readonly client: Client;
  private readonly db: firestore.Firestore;
  private emojis: {[name: string]: Emoji} = {};

  constructor(
    private readonly discordService: DiscordService,
    private readonly dataService: DataService,
  ) {
    this.client = this.discordService.getClient();
    this.db = this.dataService.db;
  }

  private react({ name, msg }: { name: string, msg: Message }) {
    msg.react(msg.guild.emojis.find(emoji => emoji.name === name).identifier);
  }

  private async _init() {
    const doc = await this.db.collection('app-data').doc('david-bot').get();
    if (!doc.exists) {
      await this.db.collection('app-data').doc('david-bot').create({
        votes: {
          eck: 0,
          peace: 0,
        },
      });
    }
  }

  public async init() {
    await this._init();

    this.client.on('messageReactionAdd', async (reaction) => {
      if (reaction.emoji.name === 'eck') {
        await this.db.collection('app-data')
          .doc('david-bot').update({ 'votes.eck': decrement });
      }
      if (reaction.emoji.name === 'peacecream') {
        await this.db.collection('app-data')
          .doc('david-bot').update({ 'votes.peace': increment });
      }
    });

    this.client.on("message", async (msg) => {

      if (msg.member.user.bot === true) {
        return;
      }

      if (this.matchEck(msg.content)) {
        this.react({
          name: 'eck',
          msg,
        });
      } 
      else if (this.matchPeaceCream(msg.content)){
        this.react({
          name: 'peacecream',
          msg,
        });
      }
      else if (this.matchDisplayVote(msg.content)){
        const doc = await this.db.collection('app-data').doc('david-bot').get();
        const { votes } = doc.data() as any;
        msg.reply(`
**The votes so far**

David Eck: ${votes.eck}
David Peace Cream: ${votes.peace}
        `);
      }
    });
  }

  public matchPeaceCream(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)vote peace(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchEck(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)vote eck(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }

  public matchDisplayVote(_msg: string): boolean {
    const msg = _msg.toLowerCase();
    const patterns: RegExp[] = [
      /(\W|^)display votes(?!\w)/g,
    ];
    return patterns.some(r => r.test(msg));
  }
}