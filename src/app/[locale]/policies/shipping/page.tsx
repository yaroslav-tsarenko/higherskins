import { PolicyLayout, ContactBlock } from "@/components/layout/PolicyLayout/PolicyLayout";

export const metadata = { title: "Trade Delivery Policy — Higherskins" };

export default function TradeDeliveryPolicyPage() {
  return (
    <PolicyLayout title="Trade Delivery Policy" lastUpdated="29 May 2026">
      <p>
        This Trade Delivery Policy explains how CS2 in-game items (&ldquo;skins&rdquo;) purchased through
        www.higherskins.com are delivered to your Steam inventory, the timeframes involved, and how we
        handle delivery issues such as Steam trade holds.
      </p>
      <p>The Website is operated by:</p>
      <ContactBlock />
      <p>
        In this Policy, &ldquo;Higherskins&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo; or &ldquo;our&rdquo;
        means HIGHER MARGINS LTD. &ldquo;Customer&rdquo;, &ldquo;you&rdquo; or &ldquo;your&rdquo; means the
        person placing an order through the Website.
      </p>
      <p>
        This Trade Delivery Policy should be read together with our Terms and Conditions, Refunds and
        Cancellation Policy, Payment Policy, and Privacy Policy.
      </p>

      <h2>1. Scope of This Policy</h2>
      <p>1.1 This Policy applies to the delivery of digital in-game items for Counter-Strike 2 (CS2).</p>
      <p>
        1.2 Skins are delivered entirely digitally through the Steam trading system. No physical goods are
        shipped, and no postal carrier, courier, or shipping address is involved.
      </p>
      <p>
        1.3 Delivery depends on the Steam platform, its trading rules, its availability, and the accuracy of
        the Steam trade URL you provide.
      </p>
      <p>
        1.4 Delivery estimates are not guaranteed delivery times where delays are caused by Steam trade
        holds, Steam downtime, or factors outside our reasonable control.
      </p>

      <h2>2. Requirements for Delivery</h2>
      <p>2.1 To receive a skin, you must have a valid Steam account linked to your Higherskins account.</p>
      <p>
        2.2 You must provide a valid Steam trade URL under Account &rarr; Trade URL. We validate that the
        trade URL belongs to your own Steam account before saving it.
      </p>
      <p>
        2.3 Your Steam inventory must be able to receive trade offers. Delivery cannot be completed if your
        account is trade-banned, VAC-restricted from trading, has trading disabled, or has a full inventory.
      </p>
      <p>
        2.4 You are responsible for keeping your trade URL current. If you reset your trade URL on Steam,
        you must update it in your Higherskins account before purchasing.
      </p>

      <h2>3. Delivery Method</h2>
      <p>
        3.1 Once your payment is confirmed, our trading bot automatically sends a Steam trade offer to the
        trade URL on your account.
      </p>
      <p>
        3.2 You must accept the incoming trade offer in Steam for the skin to be transferred to your
        inventory. The skin is delivered the moment you accept the offer.
      </p>
      <p>
        3.3 We will never ask you to send items or funds to complete a purchase. A genuine delivery is
        always an incoming offer that gives you the skin.
      </p>

      <h2>4. Delivery Times</h2>
      <p>
        4.1 In most cases the trade offer is sent within seconds of payment confirmation, and the skin
        arrives as soon as you accept it.
      </p>
      <p>
        4.2 Delivery may take longer during Steam maintenance, high platform load, security reviews, or
        where additional verification of the transaction is required.
      </p>
      <p>
        4.3 You can track the live status of every purchase under Account &rarr; My Trades, which shows
        whether your order is Processing, a Trade offer has been sent, or the skin has been Delivered.
      </p>

      <h2>5. Steam Trade Holds</h2>
      <p>
        5.1 Steam may apply a trade hold of up to 8 days when the account sending or receiving items does
        not have Steam Mobile Guard active, or has not had it active for at least 7 days.
      </p>
      <p>
        5.2 Where a trade hold applies, the skin will still be delivered, but it may remain in a held state
        in your inventory until Steam releases it. This hold is imposed by Valve, not by Higherskins.
      </p>
      <p>
        5.3 To avoid trade holds, enable Steam Mobile Guard on your account and keep it active. We clearly
        indicate items available for instant, hold-free delivery where possible.
      </p>
      <p>
        5.4 Higherskins is not responsible for delays caused by Steam trade holds, Steam Guard settings, or
        Steam&rsquo;s trading restrictions.
      </p>

      <h2>6. Failed or Undeliverable Trades</h2>
      <p>
        6.1 A trade offer may fail to deliver if your trade URL is invalid or outdated, your inventory
        cannot receive items, your account is restricted from trading, or you decline the offer.
      </p>
      <p>
        6.2 If a trade offer cannot be completed for a reason within your control, the order will be marked
        as Failed under My Trades. Please correct the issue and contact support to arrange redelivery or a
        refund of your balance.
      </p>
      <p>
        6.3 If a trade offer cannot be sent due to a fault on our side or a Steam outage, we will retry
        delivery and, where delivery remains impossible, refund your Higherskins wallet balance in full.
      </p>

      <h2>7. Wrong or Expired Trade Offers</h2>
      <p>
        7.1 Steam trade offers expire if they are not accepted within the period set by Steam. If your
        offer expires, contact support and we will re-send it.
      </p>
      <p>
        7.2 Always confirm that an incoming trade offer originates from our official bot and contains the
        exact skin you purchased before accepting. If anything looks incorrect, decline the offer and
        contact us at info@higherskins.com.
      </p>

      <h2>8. Security and Fraud Prevention</h2>
      <p>
        8.1 We may hold, review, or cancel a delivery where a transaction is flagged for fraud, chargeback
        risk, sanctions, or compliance review.
      </p>
      <p>
        8.2 We may decline to deliver to accounts that appear compromised, are subject to Steam
        restrictions, or where the provided trade URL does not match the account that placed the order.
      </p>

      <h2>9. Events Outside Our Control</h2>
      <p>
        9.1 We are not responsible for failure or delay in delivery caused by events outside our reasonable
        control, including Steam downtime, Valve policy changes, trading suspensions, network failures, or
        other force majeure events.
      </p>
      <p>
        9.2 If such an event affects your order, we will take reasonable steps to complete delivery once the
        issue is resolved, or refund your balance where delivery is no longer possible.
      </p>

      <h2>10. Changes to This Policy</h2>
      <p>
        10.1 We may update this Trade Delivery Policy from time to time to reflect changes in Steam&rsquo;s
        trading system, our delivery process, or legal requirements.
      </p>
      <p>
        10.2 The version in force at the time you place your order will apply to that order, unless a change
        is required by law.
      </p>

      <h2>11. Contact Information</h2>
      <p>
        If you have any questions about delivery status, trade holds, failed trades, or any delivery-related
        issue, please contact us:
      </p>
      <ContactBlock />
    </PolicyLayout>
  );
}
