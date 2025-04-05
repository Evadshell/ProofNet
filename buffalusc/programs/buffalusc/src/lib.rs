use anchor_lang::prelude::*;

declare_id!("An9GXND7q4nQtq3wDtH2LZ9toeEBxVvTo7ErrmL3X4K3");

#[program]
pub mod buffalusc {
    use super::*;

    pub fn initialize(_ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }

    pub fn add_user(ctx: Context<AddUser>, client_session_id: String) -> Result<()> {
        let user = &mut ctx.accounts.user;
        
        
        let old_session = user.client_session_id.clone();
        if !old_session.is_empty() {
            user.past_session_ids.push(old_session);
        }

        
        user.client_session_id = client_session_id;
        user.is_verified = false;
        user.verified_by.clear();
        user.users_verified.clear();
        
        Ok(())
    }

    pub fn get_verified(ctx: Context<GetVerified>, verified_by: Vec<String>) -> Result<()> {
        let user = &mut ctx.accounts.user;
        user.is_verified = true;
        user.verified_by = verified_by;
        Ok(())
    }

    pub fn add_verification(
        ctx: Context<AddVerification>,
        verified_by: String,
        targeted_session_id: String,
        timestamp: i64,
        status: String,
        verified_client_session: String,
    ) -> Result<()> {
        let verification = &mut ctx.accounts.verification;
        verification.verified_by = verified_by.clone();
        verification.targeted_session_id = targeted_session_id;
        verification.timestamp = timestamp;
        verification.status = status;

        
        ctx.accounts.user.users_verified.push(verified_client_session);

        Ok(())
    }
}

#[account]
pub struct User {
    pub client_session_id: String,
    pub past_session_ids: Vec<String>, 
    pub is_verified: bool,
    pub verified_by: Vec<String>,
    pub users_verified: Vec<String>,
}

#[account]
pub struct Verification {
    pub verified_by: String,
    pub targeted_session_id: String,
    pub timestamp: i64,
    pub status: String, 
}

#[derive(Accounts)]
pub struct Initialize {}


#[derive(Accounts)]
pub struct AddUser<'info> {
    #[account(
        init, 
        payer = signer, 
        space = 8 + 512
    )]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}


#[derive(Accounts)]
pub struct GetVerified<'info> {
    #[account(mut)]
    pub user: Account<'info, User>,
}

#[derive(Accounts)]
pub struct AddVerification<'info> {
    #[account(
        init, 
        payer = signer, 
        space = 8 + 256
    )]
    pub verification: Account<'info, Verification>,
    #[account(mut)]
    pub user: Account<'info, User>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}
