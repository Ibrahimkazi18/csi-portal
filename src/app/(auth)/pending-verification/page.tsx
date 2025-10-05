export default function PendingVerification() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-3">
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="text-muted-foreground">
          We sent you a confirmation link. Please check your inbox and click the link to activate your account.
        </p>
        <p className="text-sm text-muted-foreground">
          Didn{"'"}t receive the email? Check your spam folder or contact an admin for help.
        </p>
      </div>
    </main>
  )
}
